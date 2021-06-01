import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class AltToEnterContainerExtension extends AbstractExtension {

  private _text: SVGTextElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();
    this._text = this._drawText("Press ALT to enter container", itemRect.x - this.designerView.containerBoundingRect.x + 5, itemRect.y - this.designerView.containerBoundingRect.y + 12, 'svg-text-enter-container', this._text);
  }


  override dispose() {
    this._removeAllOverlays();
  }
}