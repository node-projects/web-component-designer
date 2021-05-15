import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';

export class SelectionDefaultExtension extends AbstractExtension {

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() {
    const itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const left = Number.parseInt(computedStyle.marginLeft.replace('px', ''));
    const top = Number.parseInt(computedStyle.marginTop.replace('px', ''));
    const right = Number.parseInt(computedStyle.marginRight.replace('px', ''));
    const bottom = Number.parseInt(computedStyle.marginBottom.replace('px', ''));
    this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x - left, itemRect.y - this.designerView.containerBoundingRect.y - top, left + itemRect.width + right, top + itemRect.height + bottom, 'svg-selection');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}