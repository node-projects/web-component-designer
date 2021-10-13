import { IRect } from "../../../../interfaces/IRect";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class GrayOutExtension extends AbstractExtension {

  private _path: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    if (!this._path) {
      this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this._path.setAttribute('class', 'svg-gray-out');
      this.overlayLayerView.appendChild(this._path);
      this.overlays.push(this._path);
    }
    let itemRect = this.extendedItem.element.getBoundingClientRect();

    this.drawGrayOut(itemRect);
  }

  drawGrayOut(rect: IRect) {
    let r = { x: rect.x - this.designerView.containerBoundingRect.x, y: rect.y - this.designerView.containerBoundingRect.y, width: rect.width, height: rect.height };
    const pathPoints = "M0 0 L0 " + this.designerView.containerBoundingRect.height + "L" + r.x + " " + this.designerView.containerBoundingRect.height + "L" + r.x + " 0" + " L0 0" +
      "M" + r.x + " 0 L" + r.x + " " + r.y + "L" + this.designerView.containerBoundingRect.width + " " + r.y + "L" + this.designerView.containerBoundingRect.width + " 0" + "L" + r.x + " 0" +
      "M" + r.x + " " + (r.y + r.height) + "L" + r.x + " " + this.designerView.containerBoundingRect.height + "L" + this.designerView.containerBoundingRect.width + " " + this.designerView.containerBoundingRect.height + "L" + this.designerView.containerBoundingRect.width + " " + (r.y + r.height) + "L" + r.x + " " + (r.y + r.height) +
      "M" + (r.x + r.width) + " " + r.y + "L" + (r.x + r.width) + " " + (r.y + r.height) + "L" + this.designerView.containerBoundingRect.width + " " + (r.y + r.height) + "L" + this.designerView.containerBoundingRect.width + " " + (r.y) + "L" + (r.x + r.width) + " " + r.y;
    this._path.setAttribute("d", pathPoints);
  }


  override dispose() {
    this._removeAllOverlays();
    this._path = null;
  }
}