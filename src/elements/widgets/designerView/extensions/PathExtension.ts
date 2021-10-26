import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import "../../../helper/PathDataPolyfill";
import { IPoint } from "../../../../interfaces/IPoint";
import { IExtensionManager } from "./IExtensionManger";

export class PathExtension extends AbstractExtension {
  //private _itemRect: DOMRect;
  //private _svgRect: DOMRect;
  private _lastPos: IPoint
  private _parentRect: DOMRect;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    //this._itemRect = this.extendedItem.element.getBoundingClientRect();
    //this._svgRect = (<SVGGeometryElement>this.extendedItem.element).ownerSVGElement.getBoundingClientRect();
    this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
    const pathdata: any = (<SVGGraphicsElement>this.extendedItem.node).getPathData({normalize: true});
    for (let p of pathdata) {
      switch (p.type) {
        case 'M':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._lastPos = { x: p.values[0], y: p.values[1] };
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
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(p.values[4], p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          this._drawPathCircle(p.values[4], p.values[5]);
          this._lastPos = { x: p.values[4], y: p.values[5] };
          break;
        case 'c':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          this._drawPathCircle(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5]);
          this._lastPos = { x: p.values[4], y: p.values[5] };
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
    this._drawCircleOverlay(this._parentRect.x - this.designerView.containerBoundingRect.x + x, this._parentRect.y - this.designerView.containerBoundingRect.y + y, 3, 'svg-path');
  }

  _drawPathLine(x1: number, y1: number, x2: number, y2: number) {
    this._drawLineOverlay(this._parentRect.x - this.designerView.containerBoundingRect.x + x1, this._parentRect.y - this.designerView.containerBoundingRect.y + y1, this._parentRect.x - this.designerView.containerBoundingRect.x + x2, this._parentRect.y - this.designerView.containerBoundingRect.y + y2, 'svg-path-line');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}