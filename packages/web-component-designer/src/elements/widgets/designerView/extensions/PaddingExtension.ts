import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class PaddingExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const computedStyle = getComputedStyle(this.extendedItem.element);
    if (computedStyle.margin !== '0px') {
      const left = Number.parseFloat(computedStyle.paddingLeft.replace('px', ''));
      const top = Number.parseFloat(computedStyle.paddingTop.replace('px', ''));
      const right = Number.parseFloat(computedStyle.paddingRight.replace('px', ''));
      const bottom = Number.parseFloat(computedStyle.paddingBottom.replace('px', ''));

      const bleft = Number.parseFloat(computedStyle.borderLeftWidth.replace('px', ''));
      const btop = Number.parseFloat(computedStyle.borderTopWidth.replace('px', ''));
      const bright = Number.parseFloat(computedStyle.borderRightWidth.replace('px', ''));
      const bbottom = Number.parseFloat(computedStyle.borderBottomWidth.replace('px', ''));
      if (!isNaN(left) && !isNaN(top) && !isNaN(right) && !isNaN(bottom)) {
        if (this._valuesHaveChanges(left, top, right, bottom, bleft, btop, bright, bbottom, itemRect.x, itemRect.y, itemRect.width, itemRect.height)) {
          this._removeAllOverlays();
          this._drawRect(itemRect.x + bleft + left, itemRect.y + btop, itemRect.width - left - right - bleft - bright, top, 'svg-padding', null, OverlayLayer.Background);
          this._drawRect(itemRect.x + bleft, itemRect.y + btop, left, itemRect.height - btop - bbottom, 'svg-padding', null, OverlayLayer.Background);
          this._drawRect(itemRect.x + bleft + left, itemRect.y + itemRect.height - bottom - bbottom, itemRect.width - left - right - bleft - bright, bottom, 'svg-padding', null, OverlayLayer.Background);
          this._drawRect(itemRect.x + itemRect.width - right - bright, itemRect.y + btop, right, itemRect.height - btop - bbottom, 'svg-padding', null, OverlayLayer.Background);
        }
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}