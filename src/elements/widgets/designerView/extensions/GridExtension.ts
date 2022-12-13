import { EventNames } from "../../../../enums/EventNames";
import { CalculateGridInformation } from "../../../helper/GridHelper.js";
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
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
              elementStyle.gridTemplateColumns = this._calculateNewSize(this._initialSizes.x, this._initialSizes.xUnit, event.clientX - this._initialPoint.x, gapColumn, parseFloat(elementStyle.width.substring(0, elementStyle.width.length - 2)), null);
              break;
            case "ns-resize":
              elementStyle.gridTemplateRows = this._calculateNewSize(this._initialSizes.y, this._initialSizes.yUnit, event.clientY - this._initialPoint.y, gapRow, null, parseFloat(elementStyle.height.substring(0, elementStyle.height.length - 2)));
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
    var retXUnit = [];
    var retYUnit = [];

    var tmpX = style.gridTemplateColumns.split(' ');
    tmpX.forEach(x => {
      var r = this._parseInitValue(x);
      retX.push(r.value);
      retXUnit.push(r.unit);
    });
    
    var tmpY = style.gridTemplateRows.split(' ');
    tmpY.forEach(y => {
      var r = this._parseInitValue(y);
      retY.push(r.value);
      retYUnit.push(r.unit);
    });
    console.log({x: retX, y: retY, xUnit: retXUnit, yUnit: retYUnit})
    return {x: retX, y: retY, xUnit: retXUnit, yUnit: retYUnit};
  }

  _parseInitValue(stringValue : string){
      var i = stringValue.length;
      while (isNaN(parseInt(stringValue.substring(i - 1, stringValue.length)))) i--;
      return {value: parseFloat(stringValue.substring(0, i)), unit: stringValue.substring(i, stringValue.length)}
  }

  _calculateNewSize(iSizes, iUnits, diff, gapIndex, itemWidth?: number, itemHeight?: number){
    var newSizes = [];
    var newUnits = [];
    var edited = [];

    for(var i = 0; i < iSizes.length; i++) {
      if(i + 1 == gapIndex || i == gapIndex) {
        if(iUnits[i] == "%") {
          var percentDiff = itemWidth ? (1 - ((itemWidth - diff) / itemWidth)) * 100 : itemHeight ? (1 - ((itemHeight - diff) / itemHeight)) * 100 : null;
          newSizes.push(i + 1 == gapIndex ? iSizes[i] + percentDiff : i == gapIndex ? iSizes[i] - percentDiff : null);
          edited.push(true);
        }
        else if(iUnits[i] == "fr") {
          newSizes.push(iSizes[i]);
          edited.push(true);
        }
        else {
          newSizes.push(i + 1 == gapIndex ? iSizes[i] + diff : i == gapIndex ? iSizes[i] - diff : null);
          edited.push(true);
          
        }
      } 
      else {
        newSizes.push(iSizes[i]);
        edited.push(false);
      }
      newUnits.push(iUnits[i]);
    }

    var retVal = "";
    var minPixelSize = 10;
    var minPercentSize = itemHeight ? minPixelSize / itemHeight * 100 : itemWidth ? minPixelSize / itemWidth * 100 : null;

    for(var i = 0; i < newSizes.length; i++){
      if(newUnits[i] == "px" && newSizes[i] < minPixelSize){
        if(edited[i + 1] && newUnits[i + 1] == "px"){
          newSizes[i + 1] = iSizes[i] + iSizes[i + 1] - minPixelSize;
          newSizes[i] = minPixelSize;
          break;
        }
        else if(edited[i - 1] && newUnits[i - 1] == "px"){
          newSizes[i - 1] = iSizes[i] + iSizes[i - 1] - minPixelSize; 
          newSizes[i] = minPixelSize;
          break;
        }
      }
      else if(newUnits[i] == "%" && newSizes[i] < minPercentSize){
        if(edited[i + 1] && newUnits[i + 1] == "%"){
          newSizes[i + 1] = iSizes[i] + iSizes[i + 1] - minPercentSize;
          newSizes[i] = minPercentSize;
          break;
        }
        else if(edited[i - 1] && newUnits[i - 1] == "%"){
          newSizes[i - 1] = iSizes[i] + iSizes[i - 1] - minPercentSize; 
          newSizes[i] = minPercentSize;
          break;
        }
      }
      else if(newUnits[i] == "fr"){
        var editedIndex;
        if(edited[i + 1])
          editedIndex = i + 1;
        else if (edited[i - 1])
          editedIndex = i - 1
        else
          continue;

        if(newUnits[editedIndex] == "px"){
          if(newSizes[editedIndex] < minPixelSize)
            newSizes[editedIndex] = minPixelSize;
          
          var totalSize = itemWidth ? itemWidth : itemHeight ? itemHeight : null;
          var totalSizeExceptFr = 0;
          newSizes.forEach(newSize => totalSizeExceptFr += newSize)
          var totalSizeExceptEdited = 0;
          newSizes.forEach((newSize, k) => {if(!edited[k]) totalSizeExceptEdited += newSize});

          if(totalSize - totalSizeExceptFr < minPixelSize)
           newSizes[editedIndex] = totalSize - totalSizeExceptEdited - minPixelSize;
        }
        else if(newUnits[editedIndex] == "%"){
          if(newSizes[editedIndex] < minPercentSize)
            newSizes[editedIndex] = minPercentSize;

          var totalSize = 100;
          var totalSizeExceptFr = 0;
          newSizes.forEach(newSize => totalSizeExceptFr += newSize)
          var totalSizeExceptEdited = 0;
          newSizes.forEach((newSize, k) => {if(!edited[k]) totalSizeExceptEdited += newSize});

          if(totalSize - totalSizeExceptFr < minPercentSize)
           newSizes[editedIndex] = totalSize - totalSizeExceptEdited - minPercentSize;
        }
      }
    }
    for(var i = 0; i < newSizes.length; i++)
      retVal += newSizes[i] + newUnits[i] + " ";

    console.log(retVal)
    return retVal;
  }
}