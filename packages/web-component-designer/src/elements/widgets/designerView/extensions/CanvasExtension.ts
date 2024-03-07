import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class CanvasExtension extends AbstractExtension {
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
      const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
      const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
      const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
      const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
      if (!isNaN(left) && !isNaN(top) && !isNaN(right) && !isNaN(bottom)) {
        if (this._valuesHaveChanges(left, top, right, bottom, itemRect.x, itemRect.y, itemRect.width, itemRect.height)) {
          this._removeAllOverlays();
          this._drawRect(itemRect.x - left, itemRect.y - top, left + itemRect.width + right, top, 'svg-margin');
          this._drawRect(itemRect.x - left, itemRect.y, left, itemRect.height, 'svg-margin');
          this._drawRect(itemRect.x + itemRect.width, itemRect.y, right, itemRect.height, 'svg-margin');
          this._drawRect(itemRect.x - left, itemRect.y + itemRect.height, left + itemRect.width + right, bottom, 'svg-margin');
        }
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}