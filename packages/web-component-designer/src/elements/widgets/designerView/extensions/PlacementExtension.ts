import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class PlacementExtension extends AbstractExtension {
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
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
    this._rect = this._drawRect(itemRect.x - left, itemRect.y - top, left + itemRect.width + right, top + itemRect.height + bottom, 'svg-hover', this._rect);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}