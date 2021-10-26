import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class AltToEnterContainerExtension extends AbstractExtension {

  private _text: SVGTextElement;
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();
    this._text = this._drawText("Press ALT to enter container", itemRect.x - this.designerView.containerBoundingRect.x + 5, itemRect.y - this.designerView.containerBoundingRect.y + 12, 'svg-text-enter-container', this._text, OverlayLayer.Background);
    this._rect = this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.width,  itemRect.height, 'svg-rect-enter-container', this._rect, OverlayLayer.Background);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}