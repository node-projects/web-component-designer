import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class FlexboxExtension extends AbstractExtension {
  private _path: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    this._path = this._drawTransformedRect(transformedCornerPoints, 'svg-flexbox', this._path, OverlayLayer.Background);
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}