import { OverlayLayer } from '../OverlayLayer.js';
import { AbstractDesignerPointerExtension } from './AbstractDesignerPointerExtension.js';

export class LinePointerExtension extends AbstractDesignerPointerExtension {
  private _circle: SVGCircleElement;
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;

  refresh(event: PointerEvent) {
    let mp = this.designerCanvas.getNormalizedEventCoordinates(event);
    this._circle = this._drawCircle(mp.x, mp.y, 1, 'svg-cursor-line-dashed', this._circle, OverlayLayer.Foreground);
    this._line1 = this._drawLine(mp.x, mp.y, mp.x, 0, 'svg-cursor-line-dashed', this._line1, OverlayLayer.Foreground);
    this._line2 = this._drawLine(mp.x, mp.y, mp.x, this.designerCanvas.outerRect.height, 'svg-cursor-line-dashed', this._line2, OverlayLayer.Foreground);
    this._line3 = this._drawLine(mp.x, mp.y, 0, mp.y, 'svg-cursor-line-dashed', this._line3, OverlayLayer.Foreground);
    this._line4 = this._drawLine(mp.x, mp.y, this.designerCanvas.outerRect.width, mp.y, 'svg-cursor-line-dashed', this._line4, OverlayLayer.Foreground);
  }

  dispose() {
    super._removeAllOverlays();
  }
}