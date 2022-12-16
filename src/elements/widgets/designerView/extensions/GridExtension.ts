import { EventNames } from "../../../../enums/EventNames.js";
import { convertCssUnit, convertCssUnitToPixel, getCssUnit } from "../../../helper/CssUnitConverter.js";
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
  private minPixelSize = 10;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    let gridInformation = CalculateGridInformation(this.extendedItem);
    this._rects = new Array(gridInformation.cells.length);
    gridInformation.cells.forEach((cellRow, i) => {
      this._rects[i] = new Array(cellRow.length);
    });
    this._gaps = new Array(gridInformation.gaps.length);
    this._resizeCircles = new Array(gridInformation.gaps.length);
    this.refresh();
  }

  override refresh() {
    let gridInformation = CalculateGridInformation(this.extendedItem);
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
    let resizeCircle = this._drawCircle((gap.x + (gap.width/2)), (gap.y + (gap.height/2)), 1.5, 'svg-grid-resizer', oldCircle, OverlayLayer.Foregorund);
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
        this._initialSizes = {x: (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns.split(' '), y: (<HTMLElement>this.extendedItem.element).style.gridTemplateRows.split(' ')};
        break;
      case EventNames.PointerMove:
        if(this._initialPoint) {
          let elementStyle = (<HTMLElement>this.extendedItem.element).style;
          this.extendedItem.element.getBoundingClientRect
          switch(circle.style.cursor){
            case "ew-resize":
              elementStyle.gridTemplateColumns = this._calculateNewSize(this._initialSizes.x, (event.clientX - this._initialPoint.x) / this.designerCanvas.zoomFactor, gapColumn, "width");
              break;
            case "ns-resize":
              elementStyle.gridTemplateRows = this._calculateNewSize(this._initialSizes.y, (event.clientY - this._initialPoint.y) / this.designerCanvas.zoomFactor, gapRow, "heigth");
              break;
          }
          this.refresh();
        }
        break;
      case EventNames.PointerUp:
        circle.releasePointerCapture(event.pointerId);
        this._initialPoint = null;
        this._initialSizes = null;

        if(this.extendedItem.getStyle("grid-template-columns") != (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns)
          this.extendedItem.setStyle("grid-template-columns", (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns);
        if(this.extendedItem.getStyle("grid-template-rows") != (<HTMLElement>this.extendedItem.element).style.gridTemplateRows)
          this.extendedItem.setStyle("grid-template-rows", (<HTMLElement>this.extendedItem.element).style.gridTemplateRows);
        break;
    }
  }

  _calculateNewSize(iSizes, diff, gapIndex, percentTarget: 'width' | 'heigth'){
    let newSizes = [];
    let edited = [];

    for(let i = 0; i < iSizes.length; i++) {
      if(i + 1 == gapIndex || i == gapIndex) {
        if(this._getCssUnit(iSizes[i]) == "fr") {
          newSizes.push(iSizes[i]);
          edited.push(true);
        }
        else {
          let convertedDiff = parseFloat(convertCssUnit(diff, <HTMLElement>this.extendedItem.element, percentTarget, this._getCssUnit(iSizes[i])).toString());
          newSizes.push((i + 1 == gapIndex ? parseFloat(iSizes[i]) + convertedDiff : i == gapIndex ? parseFloat(iSizes[i]) - convertedDiff : null) + this._getCssUnit(iSizes[i]));
          edited.push(true);
        }
      } 
      else {
        newSizes.push(iSizes[i]);
        edited.push(false);
      }
    }

    for(let i = 0; i < newSizes.length; i++){
      if(this._getCssUnit(newSizes[i]) == "fr"){
        let editedIndex;
        if(edited[i + 1])
          editedIndex = i + 1;
        else if (edited[i - 1])
          editedIndex = i - 1
        else
          continue;

        //check if newSize smaller than minimum
        if(convertCssUnitToPixel(newSizes[editedIndex], <HTMLElement>this.extendedItem.element, percentTarget) < this.minPixelSize) {
          newSizes[editedIndex] = convertCssUnit(this.minPixelSize, <HTMLElement>this.extendedItem.element, percentTarget, this._getCssUnit(newSizes[editedIndex]));
        }

        //check if fr is smaller than 10px
        let totalSize = parseFloat(percentTarget == "width" ? (<HTMLElement>this.extendedItem.element).style.width : (<HTMLElement>this.extendedItem.element).style.height);
        let totalGapSize = percentTarget == "width" ? 
          parseFloat((<HTMLElement>this.extendedItem.element).style.columnGap) * (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns.split(' ').length - 1 :
          parseFloat((<HTMLElement>this.extendedItem.element).style.rowGap) * (<HTMLElement>this.extendedItem.element).style.gridTemplateColumns.split(' ').length - 1;
        let totalSizeExceptFr = 0;
        newSizes.forEach(newSize => {
          if(this._getCssUnit(newSize) != "fr") totalSizeExceptFr += convertCssUnitToPixel(newSize, <HTMLElement>this.extendedItem.element, percentTarget);
        });
        let totalSizeExceptEdited = 0;
        newSizes.forEach((newSize, k) => {
          if(!edited[k])
            totalSizeExceptEdited += convertCssUnitToPixel(newSize, <HTMLElement>this.extendedItem.element, percentTarget);
          });

        if(totalSize - totalSizeExceptFr - totalGapSize < this.minPixelSize){
          newSizes[editedIndex] = convertCssUnit(totalSize - totalSizeExceptEdited - totalGapSize - this.minPixelSize, <HTMLElement>this.extendedItem.element, percentTarget, this._getCssUnit(iSizes[editedIndex]));
        }
      }
      else {
        if(convertCssUnitToPixel(newSizes[i], <HTMLElement>this.extendedItem.element, percentTarget) < this.minPixelSize){
          let index = edited[i + 1] ? i + 1 : edited[i - 1] ? i - 1 : null

          if(this._getCssUnit(newSizes[index]) != "fr")
            newSizes[index] = convertCssUnit(convertCssUnitToPixel(newSizes[i], <HTMLElement>this.extendedItem.element, percentTarget) + convertCssUnitToPixel(newSizes[index], <HTMLElement>this.extendedItem.element, percentTarget) - this.minPixelSize, <HTMLElement>this.extendedItem.element, percentTarget, this._getCssUnit(newSizes[index]));

          newSizes[i] = convertCssUnit(this.minPixelSize, <HTMLElement>this.extendedItem.element, percentTarget, this._getCssUnit(newSizes[i]));
          break;
          
        }
      }
    }
    let retVal = "";
    newSizes.forEach(newSize => retVal += newSize + ' ');
    return retVal;
  }

  _getCssUnit(cssValue: string) {
    return cssValue.substring(cssValue.length - 2, cssValue.length) == "fr" ? "fr" : getCssUnit(cssValue);
  }
}