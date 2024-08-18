import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class HighlightElementExtension extends AbstractExtension {

  private _rect: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (!isNaN(transformedCornerPoints.p1.x)) {
      this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-hover', this._rect, OverlayLayer.Background);
      this._rect.style.strokeWidth = (3 / this.designerCanvas.scaleFactor).toString();
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}