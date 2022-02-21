import { EventNames, IPoint } from '../../../../index.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  cursor: string = 'zoom-in';

  private _startPoint: IPoint;
  private _endPoint: IPoint;
  private _pointerMovementTolerance: number = 5;
  private _zoomStepSize: number = 1; //number x 100 = Scale in percent

  activated(serviceContainer: ServiceContainer) {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const eventPoint = designerCanvas.getNormalizedEventCoordinates(event)

    let offsetOuter: IPoint = {
      x: (event.clientX - designerCanvas.outerRect.x) / designerCanvas.zoomFactor,
      y: (event.clientY - designerCanvas.outerRect.y) / designerCanvas.zoomFactor
    }

    switch (event.type) {
      case EventNames.PointerDown:
        this._startPoint = eventPoint;
        break;
      case EventNames.PointerUp:
        this._endPoint = eventPoint;
        this._zoomOnto(this._startPoint, this._endPoint, offsetOuter, designerCanvas)
        break;
    }

  }

  private _zoomOnto(startPoint: IPoint, endPoint: IPoint, posOuter: IPoint, designerCanvas: IDesignerCanvas) {
    if (this._isPositionEqual(startPoint, endPoint)) {

      const oldZoom = designerCanvas.zoomFactor;
      const newZoom = oldZoom + this._zoomStepSize;
      const scalechange = newZoom / oldZoom;

      let deltaOffset: IPoint = {
        x: endPoint.x / oldZoom - posOuter.x,
        y: endPoint.y / oldZoom - posOuter.y,
      }

      let canvasOffset: IPoint = {
        x: -(endPoint.x / scalechange) - (deltaOffset.x / (newZoom / oldZoom)),
        y: -(endPoint.y / scalechange) - (deltaOffset.y / (newZoom / oldZoom)),
      }

      designerCanvas.zoomFactor = newZoom;
      designerCanvas.canvasOffset = canvasOffset;

    } else {

    }
  }

  private _isPositionEqual(startPoint: IPoint, endPoint: IPoint) {
    let tolerance = this._pointerMovementTolerance;
    return Math.abs(startPoint.x - endPoint.x) <= tolerance && Math.abs(startPoint.y - endPoint.y) <= tolerance;
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }

  dispose(): void {
  }
}