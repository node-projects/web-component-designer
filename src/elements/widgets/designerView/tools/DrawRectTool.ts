import { EventNames } from '../../../../enums/EventNames';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { calculateNormLegth } from '../../../helper/PathDataPolyfill';
import { DesignItem } from '../../../item/DesignItem';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IPoint } from '../../../../interfaces/IPoint';

export class DrawRectTool implements ITool {

  readonly cursor = 'crosshair';

  private _path: SVGRectElement;
  private _startPoint: IPoint;
  private _minX: number;
  private _minY: number;
  private _maxX: number;
  private _maxY: number;
  private _px: number;
  private _py: number;

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
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        this._path.setAttribute("x", currentPoint.x.toString());
        this._path.setAttribute("y", currentPoint.y.toString());
        this._path.setAttribute("width", "0");
        this._path.setAttribute("height", "0");

        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          this._minX = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x;
          this._maxX = currentPoint.x > this._startPoint.x ? currentPoint.x : this._startPoint.x;
          this._minY = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y;
          this._maxY = currentPoint.y > this._startPoint.y ? currentPoint.y : this._startPoint.y;

          if (event.ctrlKey) {
            if (event.shiftKey) {
              const normLength = 2 * calculateNormLegth(this._startPoint, currentPoint);
              this._px = this._startPoint.x - normLength / 2;
              this._py = this._startPoint.y - normLength / 2;
              this._path.setAttribute("width", (normLength).toString());
              this._path.setAttribute("height", (normLength).toString());
            }
            else {
              const w = 2 * (this._maxX - this._minX);
              const h = 2 * (this._maxY - this._minY);
              this._px = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x - w / 2;
              this._py = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y - h / 2;
              this._path.setAttribute("width", (w).toString());
              this._path.setAttribute("height", (h).toString());
            }
            this._path.setAttribute("x", this._px.toString());
            this._path.setAttribute("y", this._py.toString());
          }
          else {
            if (event.shiftKey) {
              const normLength = calculateNormLegth(this._startPoint, currentPoint);
              this._px = currentPoint.x < this._startPoint.x ? this._startPoint.x - normLength : this._startPoint.x;
              this._py = currentPoint.y < this._startPoint.y ? this._startPoint.y - normLength : this._startPoint.y;
              this._path.setAttribute("width", (normLength).toString());
              this._path.setAttribute("height", (normLength).toString());
            }
            else {
              this._px = currentPoint.x < this._startPoint.x ? currentPoint.x : this._startPoint.x;
              this._py = currentPoint.y < this._startPoint.y ? currentPoint.y : this._startPoint.y;
              this._path.setAttribute("width", (this._maxX - this._minX).toString());
              this._path.setAttribute("height", (this._maxY - this._minY).toString());
            }
            this._path.setAttribute("x", this._px.toString());
            this._path.setAttribute("y", this._py.toString());
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
        this._path.setAttribute("x", (this._px - mvX).toString());
        this._path.setAttribute("y", (this._py - mvY).toString());
        svg.appendChild(this._path);
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