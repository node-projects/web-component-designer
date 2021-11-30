import { EventNames } from '../../../../enums/EventNames';
import { movePathData } from '../../../helper/PathDataPolyfill';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';
import { DesignItem } from '../../../item/DesignItem';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IPoint } from '../../../..';

let lastPoint: IPoint = { x: 0, y: 0 };
let samePoint = false;
let p2pMode = false;
let pointerMoved = false;
let eventStarted = false;

export class DrawPathTool implements ITool {

  readonly cursor = 'crosshair';

  private _pathD: string;
  private _path: SVGPathElement;

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
        eventStarted = true;
        console.log("event started: " + eventStarted);
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("D", this._pathD);
        this._path.setAttribute("stroke", designerCanvas.serviceContainer.globalContext.strokeColor);
        this._path.setAttribute("fill", designerCanvas.serviceContainer.globalContext.fillBrush);
        designerCanvas.overlayLayer.addOverlay(this._path, OverlayLayer.Foregorund);

        if (lastPoint.x === currentPoint.x && lastPoint.y == currentPoint.y) {
          samePoint = true;
          console.log("Same Point: " + samePoint);
        }

        lastPoint = currentPoint;
        break;

      case EventNames.PointerMove:
        if (eventStarted) {
          pointerMoved = true;
          console.log("pointer moved: " + pointerMoved);
        }
        if (!p2pMode) {
          if (this._path) {
            this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
            this._path.setAttribute("d", this._pathD);
          }
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        if (eventStarted && !pointerMoved) {
          p2pMode = true;
          console.log("p2pMode" + p2pMode);
        }
        if (p2pMode) {
          this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD);
        }
        else {
          // const rect = this._path.getBoundingClientRect();

          // designerCanvas.overlayLayer.removeOverlay(this._path);
          // const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

          // const mvX = rect.x - designerCanvas.containerBoundingRect.x - offset;
          // const mvY = rect.y - designerCanvas.containerBoundingRect.y - offset;
          // const d = movePathData(this._path, mvX, mvY);
          // this._path.setAttribute("d", d);
          // svg.appendChild(this._path);
          // svg.style.left = (mvX) + 'px';
          // svg.style.top = (mvY) + 'px';
          // svg.style.position = 'absolute';
          // svg.style.width = (rect.width + 2 * offset) + 'px';
          // svg.style.height = (rect.height + 2 * offset) + 'px';
          // //designerView.rootDesignItem.element.appendChild(svg);
          // this._path = null;
          // this._pathD = null;

          // const di = DesignItem.createDesignItemFromInstance(svg, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          // designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));

        }
        if (samePoint && p2pMode) {
          eventStarted = false;
          p2pMode = false;
          pointerMoved = false;
          samePoint = false;
          console.log("event started: " + eventStarted);
          console.log("p2pMode: " + p2pMode);
          console.log("pointer moved: " + pointerMoved);
          console.log("same point: " + samePoint);

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
}
