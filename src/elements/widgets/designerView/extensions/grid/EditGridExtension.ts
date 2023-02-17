import { EventNames } from "../../../../../enums/EventNames.js";
import { convertCssUnit, convertCssUnitToPixel, getCssUnit } from "../../../../helper/CssUnitConverter.js";
import { CalculateGridInformation } from "../../../../helper/GridHelper.js";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";

export class EditGridExtension extends AbstractExtension {

  private _initialPoint: {x: number, y:number};
  private _initialSizes: {
    x: number[];
    xUnit: string[];
    y: number[]; 
    yUnit: string[];
  };
  private _cells: SVGRectElement[][];
  private _gaps: SVGRectElement[];
  private _headers: SVGRectElement[][];
  private _headerTexts: SVGTextElement[][];
  private _plusCircles: { circle: SVGCircleElement, verticalLine: SVGLineElement, horizontalLine: SVGLineElement }[][]
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

  private defaultHeaderSize = 20;
  private defaultPlusSize = this.defaultHeaderSize * 2 / 3;
  private defaultDistanceToBox = 5;
  private defaultDistanceBetweenHeaders = 10;

  private defaultSizeOfNewRowOrColumn = "50px";

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this._initSVGArrays();
    this.refresh();
  }

  override refresh() {
    this.gridInformation = CalculateGridInformation(this.extendedItem);
    let cells = this.gridInformation.cells;
    
    if(cells[0][0] && !isNaN(cells[0][0].height) && !isNaN(cells[0][0].width)) {
      if(this.gridInformation.cells.length != this._cells.length || this.gridInformation.cells[0].length != this._cells[0].length)
        this._initSVGArrays();

      //draw gaps
      this.gridInformation.gaps.forEach((gap, i) => {
        this._gaps[i] = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-gap', this._gaps[i], OverlayLayer.Foregorund);
        this._resizeCircles[i] = this._drawResizeCircle(gap, this._resizeCircles[i]);
      })

      //draw cells
      cells.forEach((row, i) => {
        row.forEach((cell, j) => {
          this._cells[i][j] = this._drawRect(cell.x, cell.y, cell.width, cell.height, 'svg-grid', this._cells[i][j], OverlayLayer.Background);
          if (cell.name) {
            const text = this._drawText(cell.name, cell.x, cell.y, 'svg-grid-area', null, OverlayLayer.Background);
            text.setAttribute("dominant-baseline", "hanging");
          }
        })
      })    

      //draw headers
      cells.forEach((row, i) => {  //vertical headers
        this._headers[0][i] = this._drawHeader(row[0], this._headers[0][i], i, "vertical")
        this._headerTexts[0][i] = this._drawHeaderText(row[0], this._headerTexts[0][i], "vertical");
      })

      cells[0].forEach((column, i) => {
        this._headers[1][i] = this._drawHeader(column, this._headers[1][i], i, "horizontal")
        this._headerTexts[1][i] = this._drawHeaderText(column, this._headerTexts[1][i], "horizontal");
      })

      //draw circles for adding rows/columns
      for(let i = 0; i < this._plusCircles[0].length; i++)
        if(i < this._plusCircles[0].length - 1)
          this._plusCircles[0][i] = this._drawPlusCircle(cells[i][0].x, cells[i][0].y, this._plusCircles[0][i], i, "vertical");
        else
          this._plusCircles[0][i] = this._drawPlusCircle(cells[i - 1][0].x, cells[i - 1][0].y + cells[i - 1][0].height, this._plusCircles[0][i], i, "vertical", true);
      for(let i = 0; i < this._plusCircles[1].length; i++) 
        if(i < this._plusCircles[1].length - 1)
          this._plusCircles[1][i] = this._drawPlusCircle(cells[0][i].x, cells[0][i].y, this._plusCircles[1][i], i, "horizontal");
        else
          this._plusCircles[1][i] = this._drawPlusCircle(cells[0][i - 1].x + cells[0][i - 1].width, cells[0][i - 1].y, this._plusCircles[1][i], i, "horizontal", true);
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }

  _initSVGArrays(){
    this._removeAllOverlays();
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

  _drawHeader(cell, oldHeader, index, alignment: "vertical" | "horizontal"){
    let xOffset;
    let yOffset;
    let width;
    let height;
    if(alignment == "vertical"){
      xOffset = -(this.defaultHeaderSize + this.defaultDistanceToBox);
      yOffset = this.defaultDistanceBetweenHeaders / 2;
      width = this.defaultHeaderSize;
      height = cell.height - this.defaultDistanceBetweenHeaders;
    }
    else {
      xOffset = this.defaultDistanceBetweenHeaders / 2;
      yOffset = -(this.defaultHeaderSize + this.defaultDistanceToBox);
      width = cell.width - this.defaultDistanceBetweenHeaders;
      height = this.defaultHeaderSize;
    }

    let tmpHeader = this._drawRect(cell.x + xOffset, cell.y + yOffset, width , height, "svg-grid-header", oldHeader, OverlayLayer.Foregorund);
    tmpHeader.style.pointerEvents = "all";
    if(!oldHeader){
      tmpHeader.addEventListener(EventNames.PointerMove, event => {
        this._toggleDisplayPlusCircles(index, alignment, true);
      })
    }

    return tmpHeader
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

  _drawPlusCircle(x, y, oldPlusElement: { circle: SVGCircleElement, verticalLine: SVGLineElement, horizontalLine: SVGLineElement }, index, alignment: "vertical" | "horizontal", final = false){
    let plusElement = {circle: null, verticalLine: null, horizontalLine: null};
    let posX;
    let posY;
    let gapOffset = index == 0 || final ? 0 : -(convertCssUnitToPixel(this.extendedItem.getStyle(alignment == "vertical" ? "row-gap" : "column-gap"), <HTMLElement>this.extendedItem.element, alignment == "vertical" ? "height" : "width") / 2);

    if(alignment == "vertical") {
      posX = x - this.defaultDistanceToBox - this.defaultHeaderSize / 2;
      posY = y + gapOffset;
    }
    else {
      posX = x + gapOffset;
      posY = y - this.defaultDistanceToBox - this.defaultHeaderSize / 2;
    }
    plusElement.circle = this._drawCircle(posX, posY, this.defaultHeaderSize / 2, 'svg-grid-resizer', oldPlusElement ? oldPlusElement.circle : null, OverlayLayer.Foregorund)
    plusElement.circle.style.pointerEvents = "all";
    plusElement.circle.style.cursor = "pointer";
    plusElement.circle.style.display = "none";
    if(!oldPlusElement) {
      plusElement.circle.addEventListener(EventNames.PointerMove, event => this._toggleDisplayPlusCircles(index, alignment));
      plusElement.circle.addEventListener(EventNames.PointerDown, event => {
        this._editGrid(index, alignment, "add");
        event.stopPropagation();
      });
    }

    plusElement.verticalLine = this._drawLine(posX, posY - this.defaultPlusSize / 2, posX, posY + this.defaultPlusSize / 2, "svg-grid-plus-sign", oldPlusElement ? oldPlusElement.verticalLine : null, OverlayLayer.Foregorund);
    plusElement.verticalLine.style.display = "none";
    plusElement.horizontalLine = this._drawLine(posX - this.defaultPlusSize / 2, posY, posX + this.defaultPlusSize / 2, posY, "svg-grid-plus-sign", oldPlusElement ? oldPlusElement.horizontalLine : null, OverlayLayer.Foregorund);
    plusElement.horizontalLine.style.display = "none";
    return plusElement;
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
          if(circle.style.cursor == "ew-resize")
            elementStyle.gridTemplateColumns = this._calculateNewSize(this._initialSizes.x, this._initialSizes.xUnit, (event.clientX - this._initialPoint.x) / this.designerCanvas.zoomFactor, gapColumn, "width");
          else if(circle.style.cursor == "ns-resize")
            elementStyle.gridTemplateRows = this._calculateNewSize(this._initialSizes.y, this._initialSizes.yUnit, (event.clientY - this._initialPoint.y) / this.designerCanvas.zoomFactor, gapRow, "height");
          this.refresh();
        }
        break;
      case EventNames.PointerUp:
        circle.releasePointerCapture(event.pointerId);
        if(circle.style.cursor == "ew-resize")
            this.extendedItem.setStyle("grid-template-columns", this._calculateNewSize(this._initialSizes.x, this._initialSizes.xUnit, (event.clientX - this._initialPoint.x) / this.designerCanvas.zoomFactor, gapColumn, "width", true));
        else if(circle.style.cursor == "ns-resize")
            this.extendedItem.setStyle("grid-template-rows", this._calculateNewSize(this._initialSizes.y, this._initialSizes.yUnit, (event.clientY - this._initialPoint.y) / this.designerCanvas.zoomFactor, gapRow, "height", true));
        this._initialPoint = null;
        this._initialSizes = null;
        this.refresh();
        break;
    }
  }

  _calculateNewSize(iSizes: number[], iUnits: string[], diff, gapIndex, percentTarget: 'width' | 'height', pointerUp = false){
    let newSizes: number[] = [];
    let edited = [];

    for(let i = 0; i < iSizes.length; i++) {
      newSizes.push(i + 1 == gapIndex ? iSizes[i] + diff : i == gapIndex ? iSizes[i] - diff : iSizes[i]);
      edited.push(i + 1 == gapIndex || i == gapIndex);      
    }
    for(let i = 0; i < newSizes.length; i++) {
      let index = edited[i + 1] ? i + 1 : edited[i - 1] ? i - 1 : null;
      if(newSizes[i] < 0 && pointerUp) {
        if(confirm("Do you want to delete this " + (percentTarget == "width" ? "column" : "row") + "?")){
          this._editGrid(i, percentTarget == "width" ? "horizontal" : "vertical", "del")
          newSizes[index] = iSizes[i] + iSizes[index];
          newSizes.splice(i, 1);
          break;
        }
      }
      if(newSizes[i] < this.minPixelSize) {
        newSizes[index] = newSizes[i] + newSizes[index] - this.minPixelSize;
        newSizes[i] = this.minPixelSize;
        break;
      }
    }
    
    let retVal = "";
    newSizes.forEach((newSize, i) => retVal += this._convertCssUnit(newSize + "px", <HTMLElement>this.extendedItem.element, percentTarget, iUnits[i]) + ' ');
    return retVal;
  }

  _editGrid(pos: number, alignment: "vertical" | "horizontal", task: "add" | "del"){
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
    if(task == "add")
      sizes.splice(pos, 0, this.defaultSizeOfNewRowOrColumn)
    else
      sizes.splice(pos, 1);
    this.extendedItem.setStyle(cellTarget, sizes.join(' '));
    if(task == "add") {
      this.extendedItem.setStyle(elementTarget, <string>convertCssUnit(this._calculateNewElementSize(elementTarget), this.designerCanvas.canvas, elementTarget, getCssUnit(this.extendedItem.getStyle(elementTarget))))
    }
    else {
      this.extendedItem.setStyle(elementTarget, <string>convertCssUnit(convertCssUnitToPixel(this.extendedItem.getStyle(elementTarget), this.designerCanvas.canvas, elementTarget) - convertCssUnitToPixel(this.extendedItem.getStyle(alignment == "vertical" ? "row-gap" : "column-gap"), <HTMLElement>this.extendedItem.element, elementTarget), this.designerCanvas.canvas, elementTarget, getCssUnit(this.extendedItem.getStyle(elementTarget))));
    }
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

  _toggleDisplayPlusCircles(index, alignment: "vertical" | "horizontal", double = false) {
    this._plusCircles.forEach(alignment => {
      alignment.forEach(element => {
        element.circle.style.display = "none";
        element.verticalLine.style.display = "none";
        element.horizontalLine.style.display = "none";
      })
    })
    if(index != -1) {
      this._plusCircles[alignment == "vertical" ? 0 : 1][index].circle.style.display = "inline";
      this._plusCircles[alignment == "vertical" ? 0 : 1][index].verticalLine.style.display = "inline";
      this._plusCircles[alignment == "vertical" ? 0 : 1][index].horizontalLine.style.display = "inline";
      if(double) {
        this._plusCircles[alignment == "vertical" ? 0 : 1][index + 1].circle.style.display = "inline";
        this._plusCircles[alignment == "vertical" ? 0 : 1][index + 1].verticalLine.style.display = "inline";
        this._plusCircles[alignment == "vertical" ? 0 : 1][index + 1].horizontalLine.style.display = "inline";
      }
    }
  }

  _convertCssUnit(cssValue: string | number, target: HTMLElement, percentTarget: 'width' | 'height', unit: string) : string | number{
    if(unit == "fr"){
      let containerSize = convertCssUnitToPixel(target.style.width, target, percentTarget);
      let amountGaps = percentTarget == "height" ? this.gridInformation.cells.length - 1 : this.gridInformation.cells[0].length - 1
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