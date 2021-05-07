import { EventNames } from '../../../../enums/EventNames';
import { IPoint } from '../../../../interfaces/IPoint';
import { IDesignItem } from '../../../item/IDesignItem';
import { IElementDefinition } from '../../../services/elementsService/IElementDefinition';
import { IDesignerView } from '../IDesignerView';
import { ITool } from './ITool';

export class DrawElementTool implements ITool {
  private _elementDefinition: IElementDefinition;
  private _createdItem: IDesignItem;
  private _startPosition: IPoint;

  constructor(elementDefinition: IElementDefinition) {
    this._elementDefinition = elementDefinition;
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
    this._startPosition = { x: event.x, y: event.y };
    this._createdItem = await designerView.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(this._elementDefinition, designerView.serviceContainer, designerView.instanceServiceContainer));
    const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
    this._createdItem.setStyle('position', 'absolute');
    this._createdItem.setStyle('top', event.offsetY + targetRect.top - designerView.containerBoundingRect.y + 'px');
    this._createdItem.setStyle('left', event.offsetX + targetRect.left - designerView.containerBoundingRect.x + 'px');
    this._createdItem.setStyle('width', '0');
    this._createdItem.setStyle('height', '0');
    (<HTMLElement>this._createdItem.element).style.overflow = 'hidden';

    designerView.rootDesignItem.element.appendChild(this._createdItem.element);
    //this.instanceServiceContainer.undoService.execute(new InsertAction(this.rootDesignItem, this._canvas.children.length, di));
    //grp.commit();
    //this.instanceServiceContainer.selectionService.setSelectedElements([di]);
  }

  private async _onPointerMove(designerView: IDesignerView, event: PointerEvent) {
    if (this._createdItem) {
      this._createdItem.setStyle('width', event.x - this._startPosition.x + 'px')
      this._createdItem.setStyle('height', event.y - this._startPosition.y + 'px')

      designerView.rootDesignItem.element.appendChild(this._createdItem.element);
    }
  }

  private async _onPointerUp(designerView: IDesignerView, event: PointerEvent) {
    this._createdItem = null;
    this._startPosition = null;
    designerView.serviceContainer.tool = null;
  }
}