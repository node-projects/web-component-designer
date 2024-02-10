import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IElementDefinition } from '../../../services/elementsService/IElementDefinition.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { ChangeGroup } from '../../../services/undoService/ChangeGroup.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';

export class DrawElementTool implements ITool {
  private _elementDefinition: IElementDefinition;
  private _createdItem: IDesignItem;
  private _startPosition: IPoint;
  private _changeGroup: ChangeGroup;

  readonly cursor = 'crosshair';
  private _rect: any;

  constructor(elementDefinition: IElementDefinition) {
    this._elementDefinition = elementDefinition;
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
    if (this._createdItem)
      this._createdItem.element.parentElement.removeChild(this._createdItem.element);
  }

  pointerEventHandler(designerView: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
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

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }

  sizeOverlapThreshold = false;
  private async _onPointerDown(designerView: IDesignerCanvas, event: PointerEvent) {
    event.preventDefault();
    this._startPosition = { x: event.x, y: event.y };

    this._changeGroup = designerView.rootDesignItem.openGroup("Insert Item");
    this._createdItem = await designerView.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(this._elementDefinition, designerView.serviceContainer, designerView.instanceServiceContainer));
    const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
    this._createdItem.setStyle('position', 'absolute');

    this._createdItem.setStyle('left', event.offsetX + targetRect.left - designerView.containerBoundingRect.x + 'px');
    this._createdItem.setStyle('top', event.offsetY + targetRect.top - designerView.containerBoundingRect.y + 'px');
    this._createdItem.setStyle('width', '0');
    this._createdItem.setStyle('height', '0');
    (<HTMLElement>this._createdItem.element).style.overflow = 'hidden';

    designerView.rootDesignItem.insertChild(this._createdItem);
    //draw via containerService??? how to draw into a grid, a stackpanel???
    designerView.instanceServiceContainer.selectionService.clearSelectedElements();
  }

  private async _onPointerMove(designerCanvas: IDesignerCanvas, event: PointerEvent) {
    if (this._createdItem) {
      if (!this._rect) {
        this._rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._rect, OverlayLayer.Foreground);
        this._rect.setAttribute('class', 'svg-draw-new-element');
        this._rect.setAttribute('x', <string><any>(this._startPosition.x - designerCanvas.containerBoundingRect.x));
        this._rect.setAttribute('y', <string><any>(this._startPosition.y - designerCanvas.containerBoundingRect.y));
      }

      const w = event.x - this._startPosition.x;
      const h = event.y - this._startPosition.y;
      if (w >= 0) {
        this._rect.setAttribute('width', w);
        this._createdItem.setStyle('width', w + 'px');
      }
      if (h >= 0) {
        this._rect.setAttribute('height', h);
        this._createdItem.setStyle('height', h + 'px');
      }

      if (w > 5 || h > 5)
        this.sizeOverlapThreshold = true;
    }
  }

  private async _onPointerUp(designerView: IDesignerCanvas, event: PointerEvent) {
    if (this.sizeOverlapThreshold) {
      this._changeGroup.commit();
      designerView.instanceServiceContainer.selectionService.setSelectedElements([this._createdItem]);
    } else {
      this._changeGroup.abort();
    }
    designerView.overlayLayer.removeOverlay(this._rect);
    this._startPosition = null;
    this._rect = null;
    this._createdItem = null;

    designerView.serviceContainer.globalContext.finishedWithTool(this);
  }
}