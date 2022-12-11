import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from "./OverlayLayer.js";

export class InvisibleDivExtension extends AbstractExtension {
  private _rect: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerCanvas, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas);
    this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-invisible-div', this._rect, OverlayLayer.Background);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}