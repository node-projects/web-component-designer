import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PositionExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() { // TODO: - extension only when draging arround (maybe?)
    const computedStyle = getComputedStyle(this.extendedItem.element);

    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const xOffset = itemRect.x - this.designerView.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerView.containerBoundingRect.y;

    const left = Number.parseFloat(computedStyle.left.replace('px', ''));
    const top = Number.parseFloat(computedStyle.top.replace('px', ''));
    const right = Number.parseFloat(computedStyle.right.replace('px', ''));
    const bottom = Number.parseFloat(computedStyle.bottom.replace('px', ''));

    let tx = 0;
    let ty = 0;
    if (computedStyle.transform !== 'none') {
      const transforms = computedStyle.transform.replace('matrix(', '').split(',');
      tx = Number.parseFloat(transforms[4]);
      ty = Number.parseFloat(transforms[5].replace(')', ''));
    }

    this._line1 = this._drawLineOverlay(xOffset - left - tx, yOffset + itemRect.height / 2, xOffset, yOffset + itemRect.height / 2, 'svg-position', this._line1);
    this._line2 = this._drawLineOverlay(xOffset + itemRect.width / 2, yOffset - top - ty, xOffset + itemRect.width / 2, yOffset, 'svg-position', this._line2);
    this._line3 = this._drawLineOverlay(xOffset + itemRect.width, yOffset + itemRect.height / 2, xOffset + itemRect.width + right + -1 * tx, yOffset + itemRect.height / 2, 'svg-position', this._line3);
    this._line4 = this._drawLineOverlay(xOffset + itemRect.width / 2, yOffset + itemRect.height, xOffset + itemRect.width / 2, yOffset + itemRect.height + bottom + -1 * ty, 'svg-position', this._line4);
  }



  override dispose() {
    this._removeAllOverlays();
  }
}