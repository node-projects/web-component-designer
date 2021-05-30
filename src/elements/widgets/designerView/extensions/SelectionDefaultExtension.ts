import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class SelectionDefaultExtension extends AbstractExtension {
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const left = Number.parseInt(computedStyle.marginLeft.replace('px', ''));
    const top = Number.parseInt(computedStyle.marginTop.replace('px', ''));
    const right = Number.parseInt(computedStyle.marginRight.replace('px', ''));
    const bottom = Number.parseInt(computedStyle.marginBottom.replace('px', ''));
    this._rect = this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x - left, itemRect.y - this.designerView.containerBoundingRect.y - top, left + itemRect.width + right, top + itemRect.height + bottom, 'svg-selection', this._rect);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}