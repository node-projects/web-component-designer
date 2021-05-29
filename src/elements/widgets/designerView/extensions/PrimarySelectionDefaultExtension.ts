//import { EventNames } from "../../../../enums/EventNames";
//import { PointerActionType } from "../../../../enums/PointerActionType";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class PrimarySelectionDefaultExtension extends AbstractExtension {

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const rect = this.extendedItem.element.getBoundingClientRect();
    this._drawMoveOverlay(rect);
  }

  _drawMoveOverlay(itemRect: DOMRect) {
    const rect = this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y - 16, 60, 15, 'svg-primary-selection-move');
    
    //TODO: -> how to move elemnt now???
    
    //rect.addEventListener(EventNames.PointerDown, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    //rect.addEventListener(EventNames.PointerMove, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    //rect.addEventListener(EventNames.PointerUp, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    this._drawText(this.extendedItem.name.substring(0, 10) + '…', itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y - 5, 'svg-text');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}