import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class CanvasExtension extends AbstractExtension {

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    if (computedStyle.margin !== '0px') {
      const xOffset = itemRect.x - this.designerCanvas.containerBoundingRect.x;
      const yOffset = itemRect.y - this.designerCanvas.containerBoundingRect.y;

      const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
      const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
      const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
      const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));

      this._drawRect(xOffset - left, yOffset - top, left + itemRect.width + right, top, 'svg-margin');
      this._drawRect(xOffset - left, yOffset, left, itemRect.height, 'svg-margin');
      this._drawRect(xOffset + itemRect.width, yOffset, right, itemRect.height, 'svg-margin');
      this._drawRect(xOffset - left, yOffset + itemRect.height, left + itemRect.width + right, bottom, 'svg-margin');
    }
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}