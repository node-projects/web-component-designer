import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class MarginExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }
  
  private _path: SVGPathElement;
  
  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const computedStyle = getComputedStyle(this.extendedItem.element);
    if (computedStyle.margin !== '0px') {
      const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
      const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
      const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
      const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
      if (!isNaN(left) && !isNaN(top) && !isNaN(right) && !isNaN(bottom)) {
        const p = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas, cache);
        if (!isNaN(p[0].x)) {
          if (this._valuesHaveChanges(left, top, right, bottom, p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y)) {
            const p2 = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, [{ x: left, y: top }, { x: right, y: top }, { x: left, y: bottom }, { x: right, y: bottom }], this.designerCanvas, cache);
            let d = "M" + [p[0], p[1], p[3], p[2]].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
            d += "M" + [p2[0], p2[1], p2[3], p2[2]].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
            this._path = this._drawPath(d, 'svg-margin', this._path, OverlayLayer.Background);
          }
        }
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}