import { IRect } from "../../../../interfaces/IRect";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
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
      this.overlayLayerView.addOverlay(this._path, OverlayLayer.Background);
      this.overlays.push(this._path);
    }
    let itemRect = this.extendedItem.element.getBoundingClientRect();

    this.drawGrayOut(itemRect);
  }

  drawGrayOut(rect: IRect) {
    let r = { x: rect.x - this.designerCanvas.containerBoundingRect.x, y: rect.y - this.designerCanvas.containerBoundingRect.y, width: rect.width, height: rect.height };
    const pathPoints = "M0 0 L0 " + this.designerCanvas.containerBoundingRect.height + "L" + r.x + " " + this.designerCanvas.containerBoundingRect.height + "L" + r.x + " 0" + " L0 0" +
      "M" + r.x + " 0 L" + r.x + " " + r.y + "L" + this.designerCanvas.containerBoundingRect.width + " " + r.y + "L" + this.designerCanvas.containerBoundingRect.width + " 0" + "L" + r.x + " 0" +
      "M" + r.x + " " + (r.y + r.height) + "L" + r.x + " " + this.designerCanvas.containerBoundingRect.height + "L" + this.designerCanvas.containerBoundingRect.width + " " + this.designerCanvas.containerBoundingRect.height + "L" + this.designerCanvas.containerBoundingRect.width + " " + (r.y + r.height) + "L" + r.x + " " + (r.y + r.height) +
      "M" + (r.x + r.width) + " " + r.y + "L" + (r.x + r.width) + " " + (r.y + r.height) + "L" + this.designerCanvas.containerBoundingRect.width + " " + (r.y + r.height) + "L" + this.designerCanvas.containerBoundingRect.width + " " + (r.y) + "L" + (r.x + r.width) + " " + r.y;
    this._path.setAttribute("d", pathPoints);
  }


  override dispose() {
    this._removeAllOverlays();
    this._path = null;
  }
}