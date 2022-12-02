import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";
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
    let transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, 0, this.designerCanvas);
    this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-invisible-div', this._rect, OverlayLayer.Background);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}