import { EventNames } from '../../../../enums/EventNames';
import { moveSVGData } from '../../../helper/PathDataPolyfill';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { DesignItem } from '../../../item/DesignItem';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IPoint } from '../../../..';



export class DrawPathTool implements ITool {

  readonly cursor = 'crosshair';

  private _pathD: string;
  private _path: SVGPathElement;
  private _samePoint = false;
  private _p2pMode = false;
  private _dragMode = false;
  private _pointerMoved = false;
  private _eventStarted = false;
  private _lastPoint: IPoint = { x: 0, y: 0 };
  private _savedPoint: IPoint = { x: 0, y: 0 };

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    const offset = 50;


    switch (event.type) {
      case EventNames.PointerDown:
        this._eventStarted = true;

        if (!this._p2pMode) {
          (<Element>event.target).setPointerCapture(event.pointerId);
          this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD);
          this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
          this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
          this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
          designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        }

        if (this._lastPoint.x === currentPoint.x && this._lastPoint.y === currentPoint.y && !this._samePoint) {
          this._samePoint = true;
        }

        this._lastPoint = currentPoint;
        break;


      case EventNames.PointerMove:
        if (this._eventStarted) {
          this._pointerMoved = true;
        }
        if (!this._p2pMode) {
          this._dragMode = true;
          if (this._path) {
            this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
            this._path.setAttribute("d", this._pathD);
          }
        }
        else {  // shows line preview
          if (this._path) {
            let straightLine = currentPoint;
            if (event.shiftKey)
              straightLine = this.straightenLine(this._savedPoint, currentPoint);
            this._path.setAttribute("d", this._pathD + "L" + straightLine.x + " " + straightLine.y);
          }
        }
        break;


      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        if (this._eventStarted && !this._pointerMoved) {
          this._p2pMode = true;
        }
        if (this._p2pMode && !this._samePoint) {
          if (this._path) {
            if (event.shiftKey) {
              let straightLine = this.straightenLine(this._savedPoint, currentPoint);
              this._pathD += "L" + straightLine.x + " " + straightLine.y;
              this._path.setAttribute("d", this._pathD);
            }
            else {
              this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
              this._path.setAttribute("d", this._pathD);
            }
            this._savedPoint = currentPoint;
          }
        }

        if (this._samePoint && this._p2pMode || this._dragMode && !this._p2pMode) {
          this._eventStarted = false;
          this._p2pMode = false;
          this._pointerMoved = false;
          this._samePoint = false;
          this._dragMode = false;

          const rect = this._path.getBoundingClientRect();
          designerCanvas.overlayLayer.removeOverlay(this._path);
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          const mvX = rect.x - designerCanvas.containerBoundingRect.x - offset;
          const mvY = rect.y - designerCanvas.containerBoundingRect.y - offset;
          const d = moveSVGData(this._path, mvX, mvY);
          this._path.setAttribute("d", d);
          svg.appendChild(this._path);
          svg.style.left = (mvX) + 'px';
          svg.style.top = (mvY) + 'px';
          svg.style.position = 'absolute';
          svg.style.width = (rect.width + 2 * offset) + 'px';
          svg.style.height = (rect.height + 2 * offset) + 'px';
          //designerView.rootDesignItem.element.appendChild(svg);
          this._path = null;
          this._pathD = null;

          const di = DesignItem.createDesignItemFromInstance(svg, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
          designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        }
        //TODO: Better Path drawing (like in SVGEDIT & Adding via Undo Framework. And adding to correct container)
        break;
    }
  }


  straightenLine(p1: IPoint, p2: IPoint): IPoint {
    let newP = p2;
    let alpha = this.calculateAlpha(p1, p2);
    let normLength;

    if ((alpha >= 337.5 && alpha < 360 || alpha >= 0 && alpha < 22.5)) { // 0
      newP = { x: p2.x, y: p1.y }
    }
    else if ((alpha >= 22.5 && alpha < 67.5)) {   // 45
      normLength = this.calculateNormLegth(p1, p2);
      newP = { x: p1.x + normLength, y: p1.y - normLength }
    }
    else if ((alpha >= 67.5 && alpha < 112.5)) {  // 90
      newP = { x: p1.x, y: p2.y }
    }
    else if ((alpha >= 112.5 && alpha < 157.5)) { // 135
      normLength = this.calculateNormLegth(p1, p2);
      newP = { x: p1.x - normLength, y: p1.y - normLength }
    }
    else if ((alpha >= 157.5 && alpha < 202.5)) { // 180
      newP = { x: p2.x, y: p1.y }
    }
    else if ((alpha >= 202.5 && alpha < 247.5)) { // 225
      normLength = this.calculateNormLegth(p1, p2);
      newP = { x: p1.x - normLength, y: p1.y + normLength }
    }
    else if ((alpha >= 247.5 && alpha < 292.5)) { // 270
      newP = { x: p1.x, y: p2.y }
    }
    else if ((alpha >= 292.5 && alpha < 337.5)) { // 315
      normLength = this.calculateNormLegth(p1, p2);
      newP = { x: p1.x + normLength, y: p1.y + normLength }
    }

    return newP;
  }

  calculateNormLegth(p1: IPoint, p2: IPoint): number {
    let normLenght;
    let currentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    let alpha = this.calculateAlpha(p1, p2);
    let beta = alpha - ((Math.floor(alpha / 90) * 90) + 45);
    normLenght = currentLength * Math.cos(beta * (Math.PI / 180)) / Math.sqrt(2);

    return normLenght;
  }

  calculateAlpha(p1: IPoint, p2: IPoint): number {
    let alpha = - 1 * Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    if (alpha < 0)
      alpha += 360;

    return alpha;
  }
}