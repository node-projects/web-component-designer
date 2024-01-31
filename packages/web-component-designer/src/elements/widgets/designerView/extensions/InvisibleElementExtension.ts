import { IPoint } from '../../../../interfaces/IPoint.js';
import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from "./OverlayLayer.js";

export class InvisibleElementExtension extends AbstractExtension {
  private _rect: SVGPathElement;
  private lastPoints: [IPoint, IPoint, IPoint, IPoint];

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerCanvas, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const t = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas, cache);
    if (!this.lastPoints || this.lastPoints[0].x != t[0].x || this.lastPoints[0].y != t[0].y || this.lastPoints[1].x != t[1].x || this.lastPoints[1].y != t[1].y || this.lastPoints[2].x != t[2].x || this.lastPoints[2].y != t[2].y || this.lastPoints[3].x != t[3].x || this.lastPoints[3].y != t[3].y) {
      this.lastPoints = t;
      this._rect = this._drawTransformedRect(t, 'svg-invisible-div', this._rect, OverlayLayer.Background);
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}