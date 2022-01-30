import { EventNames } from '../../../../enums/EventNames';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { calculateNormLegth } from '../../../helper/PathDataPolyfill';
import { DesignItem } from '../../../item/DesignItem';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IPoint } from '../../../../interfaces/IPoint';

export class DrawEllipsisTool implements ITool {

  readonly cursor = 'crosshair';

  private _path: SVGEllipseElement;
  private _startPoint: IPoint;
  private _radius: IPoint;
  private _cx: number;
  private _cy: number;

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
        this._startPoint = currentPoint;
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        this._path.setAttribute("cx", currentPoint.x.toString());
        this._path.setAttribute("cy", currentPoint.y.toString());
        this._path.setAttribute("rx", "0");
        this._path.setAttribute("ry", "0");
        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          this._radius = { x: Math.abs(currentPoint.x - this._startPoint.x), y: Math.abs(currentPoint.y - this._startPoint.y) }
          
          if (event.ctrlKey) {
            this._path.setAttribute("cx", this._startPoint.x.toString());
            this._path.setAttribute("cy", this._startPoint.y.toString());
            this._cx = this._startPoint.x;
            this._cy = this._startPoint.y;
            if (event.shiftKey) {
              const radius = calculateNormLegth(this._startPoint, currentPoint);
              this._path.setAttribute("rx", radius.toString());
              this._path.setAttribute("ry", radius.toString());
            }
            else {
              this._path.setAttribute("rx", this._radius.x.toString());
              this._path.setAttribute("ry", this._radius.y.toString());
            }
          }
          else {
            if (event.shiftKey) {
              const radius = calculateNormLegth(this._startPoint, currentPoint);
              this._radius = {x: radius, y: radius};
            }
            this._cx = currentPoint.x < this._startPoint.x ? this._startPoint.x - this._radius.x / 2 : this._startPoint.x + this._radius.x / 2;
            this._cy = currentPoint.y < this._startPoint.y ? this._startPoint.y - this._radius.y / 2 : this._startPoint.y + this._radius.y / 2;
            this._path.setAttribute("cx", this._cx.toString());
            this._path.setAttribute("cy", this._cy.toString());
            this._path.setAttribute("rx", (this._radius.x / 2).toString());
            this._path.setAttribute("ry", (this._radius.y / 2).toString());
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
        svg.appendChild(this._path);
        this._path.setAttribute("cx", (this._cx - mvX).toString());
        this._path.setAttribute("cy", (this._cy - mvY).toString());
        svg.style.left = (mvX) + 'px';
        svg.style.top = (mvY) + 'px';
        svg.style.position = 'absolute';
        svg.style.width = (rect.width + 2 * offset) + 'px';
        svg.style.height = (rect.height + 2 * offset) + 'px';
        svg.style.overflow = 'visible';
        this._path = null;
        const di = DesignItem.createDesignItemFromInstance(svg, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) 
  { }
}