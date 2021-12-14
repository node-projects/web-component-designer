import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class SelectionDefaultExtension extends AbstractExtension {
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.extendedItem.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
    const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
    const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
    const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
    this._rect = this._drawRect((itemRect.x - this.designerCanvas.containerBoundingRect.x - left) / this.designerCanvas.scaleFactor, (itemRect.y - this.designerCanvas.containerBoundingRect.y - top) / this.designerCanvas.scaleFactor, (left + itemRect.width + right) / this.designerCanvas.scaleFactor, (top + itemRect.height + bottom) / this.designerCanvas.scaleFactor, 'svg-selection', this._rect);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}