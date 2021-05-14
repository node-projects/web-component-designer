import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";

export class GridExtension extends AbstractExtension {

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const rows = computedStyle.gridTemplateRows.split(' ');
    const columns = computedStyle.gridTemplateColumns.split(' ');
    this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y + itemRect.height, 'svg-grid')
    this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.x - this.designerView.containerBoundingRect.x + itemRect.width, itemRect.y - this.designerView.containerBoundingRect.y, 'svg-grid')
    let y = 0;
    for (let r of rows) {
      if (y > 0 && computedStyle.gridRowGap) {
        y += Number.parseInt(computedStyle.gridRowGap.replace('px', ''));
        this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y + y, itemRect.x - this.designerView.containerBoundingRect.x + itemRect.width, itemRect.y - this.designerView.containerBoundingRect.y + y, 'svg-grid');
      }
      y += Number.parseInt(r.replace('px', ''));
      this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x, itemRect.y - this.designerView.containerBoundingRect.y + y, itemRect.x - this.designerView.containerBoundingRect.x + itemRect.width, itemRect.y - this.designerView.containerBoundingRect.y + y, 'svg-grid');
    }
    let x = 0;
    for (let c of columns) {
      if (x > 0 && computedStyle.gridColumnGap) {
        x += Number.parseInt(computedStyle.gridColumnGap.replace('px', ''));
        this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x + x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.x - this.designerView.containerBoundingRect.x + x, itemRect.y - this.designerView.containerBoundingRect.y + itemRect.height, 'svg-grid');
      }
      x += Number.parseInt(c.replace('px', ''));
      this._drawLineOverlay(itemRect.x - this.designerView.containerBoundingRect.x + x, itemRect.y - this.designerView.containerBoundingRect.y, itemRect.x - this.designerView.containerBoundingRect.x + x, itemRect.y - this.designerView.containerBoundingRect.y + itemRect.height, 'svg-grid');
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