import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';

export class SelectionDefaultExtension extends AbstractExtension {

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() {
    const itemRect = this.extendedItem.element.getBoundingClientRect();
    this._drawRect(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.width, itemRect.height, 'svg-selection');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}