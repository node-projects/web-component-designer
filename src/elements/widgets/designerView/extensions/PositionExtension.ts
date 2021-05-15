import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";

export class PositionExtension extends AbstractExtension {

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() { // todo - extension only when draging arround (maybe?)
    const computedStyle = getComputedStyle(this.extendedItem.element);

    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const xOffset = itemRect.x - this.designerView.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerView.containerBoundingRect.y;

    const left = Number.parseInt(computedStyle.left.replace('px', ''));
    const top = Number.parseInt(computedStyle.top.replace('px', ''));
    const right = Number.parseInt(computedStyle.right.replace('px', ''));
    const bottom = Number.parseInt(computedStyle.bottom.replace('px', ''));

    let tx = 0;
    let ty = 0;
    if (computedStyle.transform !== 'none') {
      const transforms = computedStyle.transform.replace('matrix(', '').split(',');
      tx = Number.parseInt(transforms[4]);
      ty = Number.parseInt(transforms[5].replace(')', ''));
    }

    this._drawLineOverlay(xOffset - left - tx, yOffset + itemRect.height / 2, xOffset, yOffset + itemRect.height / 2, 'svg-position');
    this._drawLineOverlay(xOffset + itemRect.width / 2, yOffset - top - ty, xOffset + itemRect.width / 2, yOffset, 'svg-position');
    this._drawLineOverlay(xOffset + itemRect.width, yOffset + itemRect.height / 2, xOffset + itemRect.width + right + -1 * tx, yOffset + itemRect.height / 2, 'svg-position');
    this._drawLineOverlay(xOffset + itemRect.width / 2, yOffset + itemRect.height, xOffset + itemRect.width / 2, yOffset + itemRect.height + bottom + -1 * ty, 'svg-position');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}