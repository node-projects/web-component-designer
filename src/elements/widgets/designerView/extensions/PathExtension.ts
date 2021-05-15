import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";
import "../../../helper/PathDataPolyfill";

export class PathExtension extends AbstractExtension {
  private _itemRect: DOMRect;

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    super(designerView, extendedItem);
  }

  override extend() {
    this._itemRect = this.extendedItem.element.getBoundingClientRect();
    const pathdata: any = (<SVGGraphicsElement>this.extendedItem.node).getPathData();
    for (let p of pathdata) {
      switch (p.type) {
        case 'M':
          this._drawPathCircle(p.values[0], p.values[1]);
          break;
        case 'L':
          this._drawPathCircle(p.values[0], p.values[1]);
          break;
        case 'H':
          break;
        case 'V':
          break;
        case 'Z':
          break;
        case 'C':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          this._drawPathCircle(p.values[4], p.values[5]);
          break;
        case 'S':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          break;
        case 'Q':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          break;
        case 'T':
          this._drawPathCircle(p.values[0], p.values[1]);
          break;
        case 'A':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[5], p.values[6]);
          break;
      }
    }
  }

  _drawPathCircle(x: number, y: number) {
    this._drawCircleOverlay(this._itemRect.x - this.designerView.containerBoundingRect.x + x, this._itemRect.y - this.designerView.containerBoundingRect.y + y, 3, 'svg-path');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}