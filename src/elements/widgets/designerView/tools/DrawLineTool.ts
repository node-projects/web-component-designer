import { EventNames } from '../../../../enums/EventNames';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { straightenLine } from '../../../helper/PathDataPolyfill';
import { DesignItem } from '../../../item/DesignItem';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IPoint } from '../../../../interfaces/IPoint';



export class DrawLineTool implements ITool {

  readonly cursor = 'crosshair';

  private _path: SVGLineElement;
  private _startPoint: IPoint;
  private _endPoint: IPoint;

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
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        // this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        // this._path.setAttribute("d", this._pathD);
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("stroke-width", designerCanvas.serviceContainer.globalContext.strokeThickness);
        this._path.setAttribute("x1", currentPoint.x.toString());
        this._path.setAttribute("y1", currentPoint.y.toString());
        this._path.setAttribute("x2", currentPoint.x.toString());
        this._path.setAttribute("y2", currentPoint.y.toString());
        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);
        break;


      case EventNames.PointerMove:
        if (this._path) {
          if (event.shiftKey) {
            let straightLine = straightenLine(this._startPoint, currentPoint);
            this._path.setAttribute("x2", straightLine.x.toString());
            this._path.setAttribute("y2", straightLine.y.toString());
            this._endPoint = straightLine;
          }
          else {
            //this._path.setAttribute("d", this._pathD + "L" + currentPoint.x + " " + currentPoint.y);
            this._path.setAttribute("x2", currentPoint.x.toString());
            this._path.setAttribute("y2", currentPoint.y.toString());
            this._endPoint = currentPoint;
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
        this._path.setAttribute("x1", (this._startPoint.x - mvX).toString());
        this._path.setAttribute("y1", (this._startPoint.y - mvY).toString());
        this._path.setAttribute("x2", (this._endPoint.x - mvX).toString());
        this._path.setAttribute("y2", (this._endPoint.y - mvY).toString());
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
}
