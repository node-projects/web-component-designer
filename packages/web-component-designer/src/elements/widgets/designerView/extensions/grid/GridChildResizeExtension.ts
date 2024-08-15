import { EventNames } from "../../../../../enums/EventNames.js";
import { IPoint } from "../../../../../interfaces/IPoint.js";
import { calculateGridInformation } from "../../../../helper/GridHelper.js";
import { IDesignItem } from "../../../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../IDesignerCanvas.js";
import { AbstractExtension } from "../AbstractExtension.js";
import { IExtensionManager } from "../IExtensionManger.js";

export class GridChildResizeExtension extends AbstractExtension {
  private _actionModeStarted: string;
  private _initialPoint: IPoint;
  private _circle1: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _circle3: SVGCircleElement;
  private _circle4: SVGCircleElement;
  private _circle5: SVGCircleElement;
  private _circle6: SVGCircleElement;
  private _circle7: SVGCircleElement;
  private _circle8: SVGCircleElement;
  private _initialComputedTransformOrigins: DOMPoint[];
  private _initialTransformOrigins: string[];
  private _styleBackup: string;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerCanvas, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    //#region Resizer circles
    let transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];

    if (isNaN(transformedCornerPoints.p1.x) || isNaN(transformedCornerPoints.p2.x)) {
      this.remove();
      return;
    }
    if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y)) {
      this._circle1 = this._drawResizerOverlay(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, 'nw-resize', this._circle1);
      this._circle2 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p2.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p2.y - transformedCornerPoints.p1.y) / 2), 'n-resize', this._circle2);
      this._circle3 = this._drawResizerOverlay(transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, 'ne-resize', this._circle3);

      this._circle4 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p4.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p4.y - transformedCornerPoints.p1.y) / 2), 'w-resize', this._circle4);
      this._circle5 = this._drawResizerOverlay(transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, 'sw-resize', this._circle5);

      this._circle6 = this._drawResizerOverlay((transformedCornerPoints.p4.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p4.x) / 2), (transformedCornerPoints.p4.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p4.y) / 2), 's-resize', this._circle6);
      this._circle8 = this._drawResizerOverlay((transformedCornerPoints.p2.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p2.x) / 2), (transformedCornerPoints.p2.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p2.y) / 2), 'e-resize', this._circle8);

      this._circle7 = this._drawResizerOverlay(transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, 'se-resize', this._circle7);
    }
    //#endregion Circles
  }

  _drawResizerOverlay(x: number, y: number, cursor: string, oldCircle?: SVGCircleElement): SVGCircleElement {
    let circle = this._drawCircle(x, y, this.designerCanvas.serviceContainer.options.resizerPixelSize / this.designerCanvas.zoomFactor, 'svg-grid-resizer', oldCircle);
    circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    if (!oldCircle) {
      circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(circle, event, cursor));
    }
    circle.style.cursor = cursor;
    return circle;
  }

  _pointerActionTypeResize(circle: SVGCircleElement, event: PointerEvent, actionMode: string) {
    event.stopPropagation();
    const currentPoint = this.designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        this._styleBackup = this.extendedItem.element.getAttribute('style');

        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._actionModeStarted = actionMode;
        this._initialComputedTransformOrigins = [];
        this._initialTransformOrigins = [];

        const toArr = getComputedStyle(this.extendedItem.element).transformOrigin.split(' ').map(x => parseFloat(x.replace('px', '')));
        const transformOrigin: DOMPoint = new DOMPoint(toArr[0], toArr[1]);
        this._initialComputedTransformOrigins.push(transformOrigin);
        this._initialTransformOrigins.push((<HTMLElement>this.extendedItem.element).style.transformOrigin);
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          let posX = 0;
          let posY = 0;
          let cellX = 0;
          let cellY = 0;

          const gridInformation = calculateGridInformation(this.extendedItem.parent);
          const gridPos = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.parent.element);
          const evPos = this.designerCanvas.getNormalizedEventCoordinates(event);
          const cs = getComputedStyle(this.extendedItem.element);
          (<HTMLElement>this.extendedItem.element).style.gridColumnStart = cs.gridColumnStart;
          (<HTMLElement>this.extendedItem.element).style.gridColumnEnd = cs.gridColumnEnd === 'auto' ? '' + (parseInt(cs.gridColumnStart) + 1) : cs.gridColumnEnd;
          (<HTMLElement>this.extendedItem.element).style.gridRowStart = cs.gridRowStart;
          (<HTMLElement>this.extendedItem.element).style.gridRowEnd = cs.gridRowEnd === 'auto' ? '' + (parseInt(cs.gridRowStart) + 1) : cs.gridRowEnd;

          if (this._actionModeStarted == 'nw-resize' || this._actionModeStarted == 'w-resize' || this._actionModeStarted == 'sw-resize') {
            for (let i = 0; i < gridInformation.cells.length; i++) {
              const cell = gridInformation.cells[i][0];
              const cellMiddlePos = posX + (cell.width / 2);
              if (evPos.x > gridPos.x + cellMiddlePos) {
                cellX = i;
              }
              posX += cell.width + gridInformation.xGap;
            }
            (<HTMLElement>this.extendedItem.element).style.gridColumnStart = '' + (cellX + 2);
          }
          if (this._actionModeStarted == 'nw-resize' || this._actionModeStarted == 'n-resize' || this._actionModeStarted == 'ne-resize') {
            for (let i = 0; i < gridInformation.cells.length; i++) {
              const cell = gridInformation.cells[i][0];
              const cellMiddlePos = posY + (cell.height / 2);
              if (evPos.y > gridPos.y + cellMiddlePos) {
                cellY = i;
              }
              posY += cell.height + gridInformation.yGap;
            }
            (<HTMLElement>this.extendedItem.element).style.gridRowStart = '' + (cellY + 2);
          }
          if (this._actionModeStarted == 'se-resize' || this._actionModeStarted == 'e-resize' || this._actionModeStarted == 'ne-resize') {
            for (let i = 0; i < gridInformation.cells.length; i++) {
              const cell = gridInformation.cells[i][0];
              const cellMiddlePos = posX + (cell.width / 2);
              if (evPos.x > gridPos.x + cellMiddlePos) {
                cellX = i;
              }
              posX += cell.width + gridInformation.xGap;
            }
            (<HTMLElement>this.extendedItem.element).style.gridColumnEnd = '' + (cellX + 2);
          }
          if (this._actionModeStarted == 'sw-resize' || this._actionModeStarted == 's-resize' || this._actionModeStarted == 'se-resize') {
            for (let i = 0; i < gridInformation.cells[0].length; i++) {
              const cell = gridInformation.cells[0][i];
              const cellMiddlePos = posY + (cell.height / 2);
              if (evPos.y > gridPos.y + cellMiddlePos) {
                cellY = i;
              }
              posY += cell.height + gridInformation.yGap;
            }
            (<HTMLElement>this.extendedItem.element).style.gridRowEnd = '' + (cellY + 2);
          }

          const resizedElements = [this.extendedItem, this.extendedItem.parent];
          this.extensionManager.refreshExtensions(resizedElements);
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        const cs = getComputedStyle(this.extendedItem.element);
        const gridColumnStart = cs.gridColumnStart;
        const gridColumnEnd = cs.gridColumnEnd;
        const gridRowStart = cs.gridRowStart;
        const gridRowEnd = cs.gridRowEnd;
        if (this._styleBackup)
          this.extendedItem.element.setAttribute('style', this._styleBackup);
        else
          this.extendedItem.element.removeAttribute('style');

        let cg = this.extendedItem.openGroup("Resize &lt;" + this.extendedItem.name + "&gt;");
        this.extendedItem.setStyle("gridColumnStart", gridColumnStart);
        this.extendedItem.setStyle("gridColumnEnd", gridColumnEnd);
        this.extendedItem.setStyle("gridRowStart", gridRowStart);
        this.extendedItem.setStyle("gridRowEnd", gridRowEnd);
        cg.commit();
        this._initialPoint = null;
        break;
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}