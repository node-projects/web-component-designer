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
  private _lastZoomPoint : IPoint = {x: -1, y: -1};

  activated(serviceContainer: ServiceContainer) {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const eventPoint = designerCanvas.getNormalizedEventCoordinates(event)

    switch (event.type) {
      case EventNames.PointerDown:
        this._startPoint = eventPoint;
        break;
      case EventNames.PointerUp:
        this._endPoint = eventPoint;
        this._zoomOnto(this._startPoint, this._endPoint, designerCanvas)
        break;
    }

  }

  private _zoomOnto(startPoint: IPoint, endPoint: IPoint, designerCanvas: IDesignerCanvas) {
    if (this._isPositionEqual(startPoint, endPoint)) {

      const oldZoom = designerCanvas.zoomFactor;
      const newZoom = oldZoom + this._zoomStepSize;

      
      console.log("Xpreoff " + designerCanvas.canvasOffset.x)
      console.log("Ypreoff " + designerCanvas.canvasOffset.y)
      let canvasOffset : IPoint;
      if(endPoint.x !== this._lastZoomPoint.x && endPoint.y !== this._lastZoomPoint.y){
        canvasOffset = {
          x: (designerCanvas.canvasOffset.x / oldZoom) - (endPoint.x / (newZoom / oldZoom)),
          y: (designerCanvas.canvasOffset.x / oldZoom) - (endPoint.y / (newZoom / oldZoom)),
        }
      } else {
        canvasOffset = {
          x: -(endPoint.x / (newZoom / oldZoom)),
          y: -(endPoint.y / (newZoom / oldZoom)),
        }
      }
      designerCanvas.zoomFactor = newZoom;
      designerCanvas.canvasOffset = canvasOffset;

      this._lastZoomPoint = endPoint;

    } else {
      console.log("moved");
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