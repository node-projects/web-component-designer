import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from "./OverlayLayer.js";

export class InvisibleElementExtension extends AbstractExtension {
  private _rect: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerCanvas, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const t = this.extendedItem.element.getBoxQuads({relativeTo: this.designerCanvas.canvas})[0];
    if (this._valuesHaveChanges(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y, t.p4.x, t.p4.y)) {
      this._rect = this._drawTransformedRect(t, 'svg-invisible-div', this._rect, OverlayLayer.Background);
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}