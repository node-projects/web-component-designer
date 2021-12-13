import { EventNames } from '../../../../enums/EventNames';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { DesignItem, InsertAction, IPoint, movePathData } from '../../../..';



export class DrawRectTool implements ITool {

  readonly cursor = 'crosshair';

  private _pathD: string;
  private _path: SVGPathElement;
  private _samePoint = false;
  private _p2pMode = false;
  private _dragMode = false;
  private _pointerMoved = false;
  private _eventStarted = false;
  private _startPoint: IPoint = { x: 0, y: 0 };

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
        console.log("Rect Tool Pressed");
        this._startPoint = currentPoint;
        this._eventStarted = true;
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("d", this._pathD);
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          if (event.shiftKey) {
            let alpha = this.calculateAlpha(this._startPoint, currentPoint);
            let normLength = Math.abs(this.calculateNormLegth(this._startPoint, currentPoint));
            if (alpha >= 0 && alpha <= 90) {
              this._path.setAttribute("d", this._pathD +
              "L" + (this._startPoint.x + normLength) + " " + this._startPoint.y +
              "L" + (this._startPoint.x + normLength) + " " + (this._startPoint.y + normLength) +
              "L" + this._startPoint.x + " " + (this._startPoint.x - normLength) + "z");
            }
            else if (alpha >= 90 && alpha <= 180) {

            }
            else if (alpha >= 180 && alpha <= 270) {

            }
            else if (alpha >= 270 && alpha <= 360) {

            }
          }
          else {
            this._path.setAttribute("d", this._pathD +
              "L" + currentPoint.x + " " + this._startPoint.y +
              "L" + currentPoint.x + " " + currentPoint.y +
              "L" + this._startPoint.x + " " + currentPoint.y + "z");
          }
        }
        break;


      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        const rect = this._path.getBoundingClientRect();
        designerCanvas.overlayLayer.removeOverlay(this._path);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const mvX = rect.x - designerCanvas.containerBoundingRect.x - offset;
        const mvY = rect.y - designerCanvas.containerBoundingRect.y - offset;
        const d = movePathData(this._path, mvX, mvY);
        this._path.setAttribute("d", d);
        svg.appendChild(this._path);
        svg.style.left = (mvX) + 'px';
        svg.style.top = (mvY) + 'px';
        svg.style.position = 'absolute';
        svg.style.width = (rect.width + 2 * offset) + 'px';
        svg.style.height = (rect.height + 2 * offset) + 'px';
        this._path = null;
        this._pathD = null;
        const di = DesignItem.createDesignItemFromInstance(svg, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  calculateAlpha(p1: IPoint, p2: IPoint): number {
    let alpha = - 1 * Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    if (alpha < 0)
      alpha += 360;

    return alpha;
  }

  calculateNormLegth(p1: IPoint, p2: IPoint): number {
    let normLenght;
    let currentLength = Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y - p1.y,2));
    let alpha = this.calculateAlpha(p1, p2);
    let beta = alpha - ((alpha % 45) * 45);
    normLenght = currentLength * Math.cos(beta);
    console.log("alpha: " + alpha);
    console.log("beta: " + beta);
    console.log("currentLength: " + currentLength);
    console.log("normLength: " + normLenght);
    console.log(alpha % 45);
    console.log((alpha % 45) * 45);
    console.log(46.2 % 45);

    return normLenght;
  }
}
