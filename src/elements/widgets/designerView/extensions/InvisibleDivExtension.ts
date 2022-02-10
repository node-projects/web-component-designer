import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class InvisibleDivExtension extends AbstractExtension {
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerCanvas, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
    const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
    const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
    const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
    this._rect = this._drawRect(itemRect.x - left, itemRect.y - top, left + itemRect.width + right, top + itemRect.height + bottom, 'svg-invisible-div', this._rect, OverlayLayer.Background);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}