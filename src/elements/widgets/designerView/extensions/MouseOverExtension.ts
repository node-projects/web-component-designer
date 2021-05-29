import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

const offset = 3;

export class MouseOverExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const xOffset = itemRect.x - this.designerView.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerView.containerBoundingRect.y;

    this._drawRect(xOffset - offset, yOffset - offset, itemRect.width + offset + offset, itemRect.height + offset + offset, 'svg-hover');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}