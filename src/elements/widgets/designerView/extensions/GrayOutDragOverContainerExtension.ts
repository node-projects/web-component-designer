import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class GrayOutDragOverContainerExtension extends AbstractExtension {

  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    this._rect = this._drawRect(itemRect.x, itemRect.y, itemRect.width,  itemRect.height, 'svg-rect-enter-container', this._rect, OverlayLayer.Foregorund);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}