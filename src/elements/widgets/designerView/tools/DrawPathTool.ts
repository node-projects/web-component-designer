import { EventNames } from '../../../../enums/EventNames';
import { IDesignItem } from '../../../item/IDesignItem';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class DrawPathTool implements ITool {
  private _createdItem: IDesignItem;
  //private _startPosition: IPoint;

  constructor() {
  }
  dispose(): void {
    if (this._createdItem)
      this._createdItem.element.parentElement.removeChild(this._createdItem.element);
  }

  get cursor() {
    return 'crosshair';
  }

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    switch (event.type) {
      case EventNames.PointerDown:
        this._onPointerDown(designerView, event);
        break;
      case EventNames.PointerMove:
        this._onPointerMove(designerView, event);
        break;
      case EventNames.PointerUp:
        this._onPointerUp(designerView, event);
        break;
    }
  }

  private async _onPointerDown(designerView: IDesignerView, event: PointerEvent) {
    event.preventDefault();
    //this._startPosition = { x: event.x, y: event.y };
  }

  private async _onPointerMove(designerView: IDesignerView, event: PointerEvent) {
  }

  private async _onPointerUp(designerView: IDesignerView, event: PointerEvent) {
  }
}