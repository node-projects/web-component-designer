//import { EventNames } from "../../../../enums/EventNames";
//import { PointerActionType } from "../../../../enums/PointerActionType";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class PrimarySelectionDefaultExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _text: SVGTextElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh() {
    const boundRect = this.extendedItem.element.getBoundingClientRect();
    this._rect = this._drawRect(boundRect.x - this.designerView.containerBoundingRect.x, boundRect.y - this.designerView.containerBoundingRect.y - 16, 60, 15, 'svg-primary-selection-move', this._rect);

    //TODO: -> how to move elemnt now???

    //rect.addEventListener(EventNames.PointerDown, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    //rect.addEventListener(EventNames.PointerMove, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    //rect.addEventListener(EventNames.PointerUp, event => this.designerView.pointerEventHandlerElement(event, this.extendedItem.element as HTMLElement, PointerActionType.Drag));
    this._text = this._drawText(this.extendedItem.name.substring(0, 10) + '…', boundRect.x - this.designerView.containerBoundingRect.x, boundRect.y - this.designerView.containerBoundingRect.y - 5, 'svg-text', this._text);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}