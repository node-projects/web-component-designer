import { EventNames, IPoint, OverlayLayer } from '../../../../index.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class ZoomTool implements ITool {

  cursor: string = 'zoom-in';

  private _rect: SVGRectElement;

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
        if (!this._rect)
          this._rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rect.setAttribute('class', 'svg-selector');
        this._rect.setAttribute('x', <string><any>(this._startPoint.x * designerCanvas.zoomFactor));
        this._rect.setAttribute('y', <string><any>(this._startPoint.y * designerCanvas.zoomFactor));
        this._rect.setAttribute('width', <string><any>0);
        this._rect.setAttribute('height', <string><any>0);
        designerCanvas.overlayLayer.addOverlay(this._rect, OverlayLayer.Foregorund);
        break;

      case EventNames.PointerMove:
        if (this._startPoint) {
          let width = eventPoint.x - this._startPoint.x;
          let height = eventPoint.y - this._startPoint.y;

          if (width >= 0) {
            this._rect.setAttribute('x', <string><any>this._startPoint.x);
            this._rect.setAttribute('width', <string><any>width);
          } else {
            this._rect.setAttribute('x', <string><any>eventPoint.x);
            this._rect.setAttribute('width', <string><any>(-1 * width));
          }
          if (height >= 0) {
            this._rect.setAttribute('y', <string><any>this._startPoint.y);
            this._rect.setAttribute('height', <string><any>height);
          } else {
            this._rect.setAttribute('y', <string><any>eventPoint.y);
            this._rect.setAttribute('height', <string><any>(-1 * height));
          }
        }
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

        designerCanvas.overlayLayer.removeOverlay(this._rect);
        this._rect = null;
        this._startPoint = null;
        break;
    }

  }

  private _zoomOnto(isZoomInto: boolean, startPoint: IPoint, endPoint: IPoint, designerCanvas: IDesignerCanvas) {
    if (this._isPositionEqual(startPoint, endPoint)) {
      const oldZoom = designerCanvas.zoomFactor;
      const newZoom = isZoomInto ? oldZoom + this._zoomStepSize : oldZoom - this._zoomStepSize;

      designerCanvas.zoomTowardsPoint(endPoint, newZoom);
    } else {
      designerCanvas.zoomOntoRectangle(startPoint, endPoint);
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