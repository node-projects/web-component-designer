import { EventNames } from '../../../../enums/EventNames';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class MagicWandTool implements ITool {
  cursor: string = 'progress';

  _path: SVGPathElement;

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        designerView.overlayLayer.appendChild(this._path);
        break;

      case EventNames.PointerMove:
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerView.overlayLayer.removeChild(this._path);
        break;
    }
  }

  dispose(): void {
  }
}