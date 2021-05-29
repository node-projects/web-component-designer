import { EventNames } from '../../../../enums/EventNames';
import { IDesignerMousePoint } from '../../../../interfaces/IDesignerMousePoint';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class RectangleSelectorTool implements ITool {
  cursor: string = 'progress';

  private _rect: SVGRectElement;
  private _initialPoint: IDesignerMousePoint;

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerView.getDesignerMousepoint(event, currentElement, event.type === 'pointerdown' ? null : this._initialPoint);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rect.setAttribute('class', 'svg-selector');
        this._rect.setAttribute('x', <string><any>this._initialPoint.x);
        this._rect.setAttribute('y', <string><any>this._initialPoint.y);
        this._rect.setAttribute('width', <string><any>0);
        this._rect.setAttribute('height', <string><any>0);
        designerView.overlayLayer.appendChild(this._rect);
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          let w = currentPoint.x - this._initialPoint.x;
          let h = currentPoint.y - this._initialPoint.y;
          if (w >= 0) {
            this._rect.setAttribute('x', <string><any>this._initialPoint.x);
            this._rect.setAttribute('width', <string><any>w);
          } else {
            this._rect.setAttribute('x', <string><any>currentPoint.x);
            this._rect.setAttribute('width', <string><any>(-1 * w));
          }
          if (h >= 0) {
            this._rect.setAttribute('y', <string><any>this._initialPoint.y);
            this._rect.setAttribute('height', <string><any>h);
          } else {
            this._rect.setAttribute('y', <string><any>currentPoint.y);
            this._rect.setAttribute('height', <string><any>(-1 * h));
          }
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerView.overlayLayer.removeChild(this._rect);
        this._rect = null;
        this._initialPoint = null;
        break;
    }
  }

  dispose(): void {
  }
}