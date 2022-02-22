import { EventNames, IPoint } from '../../../../index.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  cursor: string = 'zoom-in';

  private _startPoint: IPoint;
  private _endPoint: IPoint;
  private _pointerMovementTolerance: number = 5;
  private _zoomStepSize: number = 0.2; //number x 100 = Scale in percent

  activated(serviceContainer: ServiceContainer) {
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const eventPoint = designerCanvas.getNormalizedEventCoordinates(event);
    switch (event.type) {
      case EventNames.PointerDown:
        this._startPoint = eventPoint;
        break;
      case EventNames.PointerUp:
        this._endPoint = eventPoint;
        let isLeftClick: boolean = event.button == 0;
        switch (event.button) {
          case 0: //Left-Click
          case 2: //Right-Click
            this._zoomOnto(isLeftClick, this._startPoint, this._endPoint, designerCanvas);
            break;
        }
        break;
    }

  }

  private _zoomOnto(isZoomInto: boolean, startPoint: IPoint, endPoint: IPoint, designerCanvas: IDesignerCanvas) {
    if (this._isPositionEqual(startPoint, endPoint)) {
      const oldZoom = designerCanvas.zoomFactor;
      const newZoom = isZoomInto ? oldZoom + this._zoomStepSize : oldZoom - this._zoomStepSize;
      const scalechange = newZoom / oldZoom;
      designerCanvas.zoomTowardsPointer(endPoint, scalechange);
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