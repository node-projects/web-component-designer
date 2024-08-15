import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from "./OverlayLayer.js";

export class GrayOutExtension extends AbstractExtension {

  private _path: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    if (!this._path) {
      this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this._path.setAttribute('class', 'svg-gray-out');
      this._path.setAttribute('fill-rule', 'evenodd');
      this._addOverlay(this._path, OverlayLayer.Background);
    }

    const p = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    let outsideRect = { width: this.designerCanvas.containerBoundingRect.width / this.designerCanvas.scaleFactor, height: this.designerCanvas.containerBoundingRect.height / this.designerCanvas.scaleFactor };
    let data = "M0 0 L" + outsideRect.width + " 0 L" + outsideRect.width + ' ' + outsideRect.height + " L0 " + outsideRect.height + " Z ";
    data += "M" + p.p1.x + " " + p.p1.y + " L" + p.p2.x + " " + p.p2.y + " L" + p.p3.x + " " + p.p3.y + " L" + p.p4.x + " " + p.p4.y + " Z";
    this._path.setAttribute("d", data);
  }

  override dispose() {
    this._removeAllOverlays();
    this._path = null;
  }
}