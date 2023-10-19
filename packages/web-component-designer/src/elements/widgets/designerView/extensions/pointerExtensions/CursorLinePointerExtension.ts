import { css } from '@node-projects/base-custom-webcomponent';
import { OverlayLayer } from '../OverlayLayer.js';
import { AbstractDesignerPointerExtension } from './AbstractDesignerPointerExtension.js';

export class CursorLinePointerExtension extends AbstractDesignerPointerExtension {
  private _lineOffset = 5;
  private _lineLength = 10;

  private _circle: SVGCircleElement;
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;

  refresh(event: PointerEvent) {
    let mp = this.designerCanvas.getNormalizedEventCoordinates(event);
    this._circle = this._drawCircle(mp.x, mp.y, 1, 'svg-cursor-line', this._circle, OverlayLayer.Foreground);
    this._line1 = this._drawLine(mp.x, mp.y - this._lineOffset, mp.x, mp.y - this._lineOffset - this._lineLength, 'svg-cursor-line', this._line1, OverlayLayer.Foreground);
    this._line2 = this._drawLine(mp.x, mp.y + this._lineOffset, mp.x, mp.y + this._lineOffset + this._lineLength, 'svg-cursor-line', this._line2, OverlayLayer.Foreground);
    this._line3 = this._drawLine(mp.x - this._lineOffset, mp.y, mp.x - this._lineOffset - this._lineLength, mp.y, 'svg-cursor-line', this._line3, OverlayLayer.Foreground);
    this._line4 = this._drawLine(mp.x + this._lineOffset, mp.y, mp.x + this._lineOffset + this._lineLength, mp.y, 'svg-cursor-line', this._line4, OverlayLayer.Foreground);
  }

  dispose() {
    super._removeAllOverlays();
  }

  style = css`
    .svg-cursor-line { stroke: black; pointer-events: none }
  `;
}