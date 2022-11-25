import { EventNames } from "../../../../enums/EventNames";
import { CalculateGridInformation } from "../../../helper/GridHelper.js";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class GridExtension extends AbstractExtension {

  private _initialPoint;
  private _initialSizes;
  private _rects: SVGRectElement[][];
  private _gaps: SVGRectElement[];
  private _resizeCircles: SVGCircleElement[];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    var gridInformation = CalculateGridInformation(this.extendedItem);
    this._rects = new Array(gridInformation.cells.length);
    gridInformation.cells.forEach((cellRow, i) => {
      this._rects[i] = new Array(cellRow.length);
    });
    this._gaps = new Array(gridInformation.gaps.length);
    this._resizeCircles = new Array(gridInformation.gaps.length);
    this.refresh();
  }

  override refresh() {
    var gridInformation = CalculateGridInformation(this.extendedItem);
    gridInformation.gaps.forEach((gap, i) => {
      this._gaps[i] = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Foregorund);
      this._resizeCircles[i] = this._drawResizeCircles(gap, this._resizeCircles[i]);
    })
    gridInformation.cells.forEach((cellRow, i) => {
      cellRow.forEach((cell, j) => {
        this._rects[i][j] = this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', this._rects[i][j], OverlayLayer.Background);
        if (cell.name) {
          const text = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', null, OverlayLayer.Background);
          text.setAttribute("dominant-baseline", "hanging");
        }
      })
    })
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _drawResizeCircles(gap, oldCircle?: SVGCircleElement){
    var resizeCircle = this._drawCircle((gap.x + (gap.width/2)), (gap.y + (gap.height/2)), 1.5, 'svg-grid-reziser', oldCircle, OverlayLayer.Foregorund);
    resizeCircle.style.pointerEvents = "all";
    resizeCircle.style.cursor = gap.width < gap.height ? "ew-resize" : "ns-resize";
    if(!oldCircle) {
      resizeCircle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(event, resizeCircle, gap.column, gap.row));
      resizeCircle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(event, resizeCircle, gap.column, gap.row));
      resizeCircle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(event, resizeCircle, gap.column, gap.row));
    }
    return resizeCircle;
  }

  _pointerActionTypeResize(event: PointerEvent, circle : SVGCircleElement, gapColumn, gapRow){
    event.stopPropagation();
    switch(event.type){
      case EventNames.PointerDown:
        circle.setPointerCapture(event.pointerId);
        this._initialPoint = { x: event.clientX, y: event.clientY }
        this._initialSizes = this._getInitialSizes((<HTMLElement>this.extendedItem.element).style);
        break;
      case EventNames.PointerMove:
        if(this._initialPoint) {
          var elementStyle = (<HTMLElement>this.extendedItem.element).style;
          this.extendedItem.element.getBoundingClientRect
          switch(circle.style.cursor){
            case "ew-resize":
              elementStyle.gridTemplateColumns = this._calculateNewSize(this._initialSizes.x, event.clientX - this._initialPoint.x, gapColumn, elementStyle.width, null);
              break;
            case "ns-resize":
              elementStyle.gridTemplateRows = this._calculateNewSize(this._initialSizes.y, event.clientY - this._initialPoint.y, gapRow, null, elementStyle.height);
              break;
          }
          this.refresh();
        }
        break;
      case EventNames.PointerUp:
        circle.releasePointerCapture(event.pointerId);
        this._initialPoint = null;
        this._initialSizes = null;
        if(this.extendedItem.styles.get("grid-template-columns") != (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns)
          this.extendedItem.setStyle("grid-template-columns", (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns);
        if(this.extendedItem.styles.get("grid-template-rows") != (<HTMLElement>this.extendedItem.element).style.gridTemplateRows)
          this.extendedItem.setStyle("grid-template-rows", (<HTMLElement>this.extendedItem.element).style.gridTemplateRows);
        break;
    }
  }

  _getInitialSizes(style: CSSStyleDeclaration){
    var retX = [];
    var retY = [];
    var widths = style.gridTemplateColumns;
    if(widths.includes("calc(")){
      while(widths.length != 0){
        if(widths.indexOf(" ") == 0)
          widths = widths.substring(1, widths.length);
        var end = widths.indexOf("calc(") == 0 ? widths.indexOf(")") + 1 : widths.includes(" ") ? widths.indexOf(" ") : widths.length;
        retX.push(widths.substring(0, end));
        widths = widths.substring(end + 1, widths.length);
      }
    } 
    else
      retX = widths.split(' ');

    var heights = style.gridTemplateRows;
    if(heights.includes("calc(")){
      while(heights.length != 0){
        if(heights.indexOf(" ") == 0)
          heights = heights.substring(1, widths.length);
        var end = heights.indexOf("calc(") == 0 ? heights.indexOf(")") + 1 : heights.includes(" ") ? heights.indexOf(" ") : heights.length;
        retY.push(heights.substring(0, end));
        heights = heights.substring(end + 1, heights.length);
      }
    } 
    else 
      retY = style.gridTemplateRows.split(' ');

    return {x: retX, y: retY};
  }

  _calculateNewSize(initialSizes, diff, gapIndex, itemWidth?, itemHeight?){
    var retVal = "";
    for(var i = 0; i < initialSizes.length; i++) {
      if(i + 1 == gapIndex || i == gapIndex) {
        if(initialSizes[i].endsWith("px")){
          var oldPx = parseFloat(initialSizes[i].slice(0, initialSizes[i].length - 2));
          var newPx;
          if(i + 1 == gapIndex) {
            newPx = oldPx + diff;
          }
          else if (i == gapIndex) {
            newPx = oldPx - diff;
          }
          retVal += newPx + "px";
        }
        else if(initialSizes[i].endsWith("%")) {
          var percentDiff;
          var width;
          var height;

          if(itemWidth && itemWidth.endsWith("px")){
            width = parseFloat(itemWidth.substring(0, itemWidth.length - 2));
            percentDiff = (1 - ((width - diff) / width)) * 100;
          }
          if(itemHeight && itemHeight.endsWith("px")){
            height = parseFloat(itemHeight.substring(0, itemHeight.length - 2));
            percentDiff = (1 - ((height - diff) / height)) * 100;
          }
          if(i + 1 == gapIndex)
            retVal += parseFloat(initialSizes[i].substring(0, initialSizes[i].length - 1)) + percentDiff;

          else if(i == gapIndex)
            retVal += parseFloat(initialSizes[i].substring(0, initialSizes[i].length - 1)) - percentDiff;

          retVal += "%";
        }
      } else {
        retVal += initialSizes[i];
      }
      retVal += " ";
    }
    return retVal;
  }
}