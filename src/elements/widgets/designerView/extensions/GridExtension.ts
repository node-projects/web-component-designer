import { EventNames } from "../../../../enums/EventNames";
import { convertCssUnit, convertCssUnitToPixel, getCssUnit } from "../../../helper/CssUnitConverter";
import { CalculateGridInformation } from "../../../helper/GridHelper.js";
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from "./OverlayLayer.js";

export class GridExtension extends AbstractExtension {

  private _initialPoint;
  private _initialSizes : {
    x: any[];
    xUnit: any[];
    y: any[]; 
    yUnit: any[];
  };
  private _cells: SVGRectElement[][];
  private _gaps: SVGRectElement[];
  private _headers: SVGRectElement[][];
  private _headerTexts: SVGTextElement[][];
  private _plusCircles: SVGCircleElement[][];
  private _resizeCircles: SVGCircleElement[];
  private minPixelSize = 10;
  private gridInformation : {
    cells?: {
        x: number;
        y: number;
        width: number;
        initWidthUnit: string;
        height: number;
        initHeightUnit: string;
        name: string;
    }[][];
    gaps?: {
        x: number;
        y: number;
        width: number;
        height: number;
        column?: number;
        row?: number;
    }[];
  }

  private defaultDepth = 20;
  private defaultDistanceToBox = 5;
  private defaultDistanceBetweenHeaders = 10;

  private defaultSizeOfNewRowOrColumn = "50px";

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.gridInformation = CalculateGridInformation(this.extendedItem);
    this._cells = new Array(this.gridInformation.cells.length);
    this.gridInformation.cells.forEach((row, i) => this._cells[i] = new Array(row.length));
    this._gaps = new Array(this.gridInformation.gaps.length);
    this._headers = new Array(2);
    this._headers[0] = new Array(this.gridInformation.cells.length + 1);     //array for the headers of columns
    this._headers[1] = new Array(this.gridInformation.cells[0].length + 1);  //array for the headers of rows
    this._headerTexts = new Array(2);
    this._headerTexts[0] = new Array(this.gridInformation.cells.length + 1);
    this._headerTexts[1] = new Array(this.gridInformation.cells[0].length + 1);
    this._plusCircles = new Array(2);
    this._plusCircles[0] = new Array(this.gridInformation.cells.length + 1);
    this._plusCircles[1] = new Array(this.gridInformation.cells[0].length + 1);
    this._resizeCircles = new Array(this.gridInformation.gaps.length);
    this.refresh();
  }

  override refresh() {
    this.gridInformation = CalculateGridInformation(this.extendedItem);
    let gc = this.gridInformation.cells;

    //draw gaps
    this.gridInformation.gaps.forEach((gap, i) => {
      this._gaps[i] = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Foregorund);
      this._resizeCircles[i] = this._drawResizeCircle(gap, this._resizeCircles[i]);
    })

    //draw cells
    gc.forEach((row, i) => {
      row.forEach((cell, j) => {
        this._cells[i][j] = this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', this._cells[i][j], OverlayLayer.Background);
        if (cell.name) {
          const text = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', null, OverlayLayer.Background);
          text.setAttribute("dominant-baseline", "hanging");
        }
      })
    })    

    //draw headers
    gc.forEach((row, i) => {  //vertical headers
      this._headers[0][i] = this._drawHeader(row[0], this._headers[0][i], "vertical")
      this._headerTexts[0][i] = this._drawHeaderText(row[0], this._headerTexts[0][i], "vertical");
    })

    gc[0].forEach((column, i) => {
      this._headers[1][i] = this._drawHeader(column, this._headers[1][i], "horizontal")
      this._headerTexts[1][i] = this._drawHeaderText(column, this._headerTexts[1][i], "horizontal");
    })

    //draw circles for adding rows/columns
    for(let i = 0; i < this._plusCircles[0].length; i++)
      if(i < this._plusCircles[0].length - 1)
        this._plusCircles[0][i] = this._drawPlusCircle(gc[i][0].x, gc[i][0].y, this._plusCircles[0][i], i, "vertical");
      else
        this._plusCircles[0][i] = this._drawPlusCircle(gc[i - 1][0].x, gc[i - 1][0].y + gc[i - 1][0].height, this._plusCircles[0][i], i, "vertical");
    for(let i = 0; i < this._plusCircles[1].length; i++) 
      if(i < this._plusCircles[1].length - 1)
        this._plusCircles[1][i] = this._drawPlusCircle(gc[0][i].x, gc[0][i].y, this._plusCircles[1][i], i, "horizontal");
      else
        this._plusCircles[1][i] = this._drawPlusCircle(gc[0][i - 1].x + gc[0][i - 1].width, gc[0][i - 1].y, this._plusCircles[1][i], i, "horizontal");
    
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _drawResizeCircle(gap, oldCircle?: SVGCircleElement){
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

  _drawHeader(cell, oldHeader, alignment: "vertical" | "horizontal"){
    let xOffset;
    let yOffset;
    let width;
    let height;
    if(alignment == "vertical"){
      xOffset = -(this.defaultDepth + this.defaultDistanceToBox);
      yOffset = this.defaultDistanceBetweenHeaders / 2;
      width = this.defaultDepth;
      height = cell.height - this.defaultDistanceBetweenHeaders;
    }
    else {
      xOffset = this.defaultDistanceBetweenHeaders / 2;
      yOffset = -(this.defaultDepth + this.defaultDistanceToBox);
      width = cell.width - this.defaultDistanceBetweenHeaders;
      height = this.defaultDepth;
    }
    return this._drawRect(cell.x + xOffset, cell.y + yOffset, width , height, "svg-grid-header", oldHeader, OverlayLayer.Background);
  }

  _drawHeaderText(cell, oldHeaderText, alignment: "vertical" | "horizontal"){
    let text;
    let xOffset;
    let yOffset;
    if(alignment == "vertical"){
      text = this._getHeaderText(cell.height, cell.initHeightUnit, "height");
      xOffset = -12.5;
      yOffset = cell.height / 2;
    }
    else {
      text = this._getHeaderText(cell.width, cell.initWidthUnit, "width");
      xOffset = cell.width / 2;
      yOffset = -12.5;
    }

    let rText = this._drawText(text, cell.x + xOffset, cell.y + yOffset, null, oldHeaderText, OverlayLayer.Background);
    
    if(alignment == "vertical")
      rText.setAttribute("transform", "rotate(-90, " + (cell.x + xOffset) + ", " + (cell.y + yOffset) + ")");

    return rText;
  }

  _drawPlusCircle(x, y, oldPlusBox, index, alignment: "vertical" | "horizontal"){
    let plusBox;
    if(alignment == "vertical"){
      plusBox = this._drawCircle(x - this.defaultDistanceToBox - this.defaultDepth / 2, y, this.defaultDepth / 2, 'svg-grid-resizer', oldPlusBox, OverlayLayer.Foregorund)
    }
    else {
      plusBox = this._drawCircle(x, y - this.defaultDistanceToBox - this.defaultDepth / 2, this.defaultDepth / 2, 'svg-grid-resizer', oldPlusBox, OverlayLayer.Foregorund)
    }
    plusBox.style.pointerEvents = "all";
    plusBox.style.cursor = "pointer";
    if(!oldPlusBox)
      plusBox.addEventListener(EventNames.PointerDown, event => this._addToGrid(index, alignment));
    return plusBox;
  }

  _getHeaderText(size: number, unit: string, percentTarget: "width" | "height"){
    return Math.round(parseFloat(<string>this._convertCssUnit(size, <HTMLElement>this.extendedItem.element, percentTarget, unit)) * 10) / 10 + unit;
  }

  _getInitialSizes(){
    let rX = [];      //in pixels
    let rXUnit = [];  //original unit
    let rY = [];      //in pixels
    let rYUnit = [];  //original unit
    this.gridInformation.cells[0].forEach(row => {
      rX.push(row.width)
      rXUnit.push(row.initWidthUnit);
    })
    this.gridInformation.cells.forEach(column => {
      rY.push(column[0].height)
      rYUnit.push(column[0].initHeightUnit);
    })
    return {x: rX, xUnit: rXUnit, y: rY, yUnit: rYUnit};
  }

  _pointerActionTypeResize(event: PointerEvent, circle : SVGCircleElement, gapColumn, gapRow){
    event.stopPropagation();
    switch(event.type){
      case EventNames.PointerDown:
        circle.setPointerCapture(event.pointerId);
        this._initialPoint = { x: event.clientX, y: event.clientY }
        this._initialSizes = this._getInitialSizes();
        break;
      case EventNames.PointerMove:
        if(this._initialPoint) {
          let elementStyle = (<HTMLElement>this.extendedItem.element).style;
          this.extendedItem.element.getBoundingClientRect
          switch(circle.style.cursor){
            case "ew-resize":
              elementStyle.gridTemplateColumns = this._calculateNewSize(this._initialSizes.x, this._initialSizes.xUnit, (event.clientX - this._initialPoint.x) / this.designerCanvas.zoomFactor, gapColumn, "width");
              break;
            case "ns-resize":
              elementStyle.gridTemplateRows = this._calculateNewSize(this._initialSizes.y, this._initialSizes.yUnit, (event.clientY - this._initialPoint.y) / this.designerCanvas.zoomFactor, gapRow, "height");
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
        this.refresh();
        break;
    }
  }

  _calculateNewSize(iSizes: number[], iUnits: string[], diff, gapIndex, percentTarget: 'width' | 'height'){
    let newSizes: number[] = [];
    let edited = [];

    for(let i = 0; i < iSizes.length; i++) {
      newSizes.push(i + 1 == gapIndex ? iSizes[i] + diff : i == gapIndex ? iSizes[i] - diff : iSizes[i]);
      edited.push(i + 1 == gapIndex || i == gapIndex);      
    }
    for(let i = 0; i < newSizes.length; i++){
      if(newSizes[i] < this.minPixelSize){
        let index = edited[i + 1] ? i + 1 : edited[i - 1] ? i - 1 : null
        newSizes[index] = newSizes[i] + newSizes[index] - this.minPixelSize;
        newSizes[i] = this.minPixelSize;
        break;
      }
    }
    
    let retVal = "";
    newSizes.forEach((newSize, i) => retVal += this._convertCssUnit(newSize + "px", <HTMLElement>this.extendedItem.element, percentTarget, iUnits[i]) + ' ');
    return retVal;
  }

  _addToGrid(pos: number, alignment: "vertical" | "horizontal"){
    let cellTarget;
    let elementTarget;
    
    if(alignment == "vertical"){
      cellTarget = "grid-template-rows";
      elementTarget = "height";
    }
    else {
      cellTarget = "grid-template-columns";
      elementTarget = "width";
    }

    let sizes = this.extendedItem.getStyle(cellTarget).split(' ');
    sizes.splice(pos, 0, this.defaultSizeOfNewRowOrColumn)
    this.extendedItem.setStyle(cellTarget, sizes.join(' '));

    let newElementSize = <string>convertCssUnit(this._calculateNewElementSize(elementTarget), this.designerCanvas.canvas, elementTarget, getCssUnit(this.extendedItem.getStyle(elementTarget)));
    
    this.extendedItem.setStyle(elementTarget, newElementSize)
  }

  _calculateNewElementSize(elementTarget: "width" | "height") : string{
    let gc = CalculateGridInformation(this.extendedItem);
    let tmpSize = 0;

    if(elementTarget == "width") {
      gc.cells[0].forEach(cell => { tmpSize += cell.width })
      tmpSize += convertCssUnitToPixel(this.extendedItem.getStyle("column-gap"), <HTMLElement>this.extendedItem.element, elementTarget) * (gc.cells[0].length - 1)
    }
    else {
      gc.cells.forEach(row => { tmpSize += row[0].height })
      tmpSize += convertCssUnitToPixel(this.extendedItem.getStyle("row-gap"), <HTMLElement>this.extendedItem.element, elementTarget) * (gc.cells.length - 1)
    }
    return tmpSize + "px";
  }

  _convertCssUnit(cssValue: string | number, target: HTMLElement, percentTarget: 'width' | 'height', unit: string) : string | number{
    if(unit == "fr"){
      let containerSize = convertCssUnitToPixel(target.style.width, target, percentTarget);
      let amountGaps = percentTarget == "width" ? this.gridInformation.cells.length - 1 : this.gridInformation.cells[0].length - 1
      let gapSize = convertCssUnitToPixel(percentTarget == "width" ? target.style.columnGap : target.style.rowGap, target, percentTarget)
      let containerSizeWithoutGaps = containerSize - gapSize * amountGaps;

      let amountFrSizes = 0;
      let leftOver = containerSizeWithoutGaps;
      if(percentTarget == "width"){
        this.gridInformation.cells[0].forEach((column, i) => {
          if(column.initWidthUnit == "fr")
            amountFrSizes++;
          else
            leftOver -= column.width;
        }) 
      }
      else {
        this.gridInformation.cells.forEach((row, i) => {
          if(row[0].initHeightUnit == "fr")
            amountFrSizes++;
          else
            leftOver -= row[0].height;
        })
      }

      let frRatio = leftOver / amountFrSizes;
      if(typeof cssValue == "number"){
        //expected Value in Pixel
        return (cssValue / frRatio) + "fr";
      }
      else {
        return (convertCssUnitToPixel(cssValue, target, percentTarget) / frRatio) + "fr"
      }
    }
    else
      return convertCssUnit(cssValue, target, percentTarget, unit);
  }
}