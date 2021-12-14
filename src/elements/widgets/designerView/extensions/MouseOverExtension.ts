import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

const offset = 3;

export class MouseOverExtension extends AbstractExtension {

  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let itemRect = this.extendedItem.element.getBoundingClientRect();

    const xOffset = itemRect.x - this.designerCanvas.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerCanvas.containerBoundingRect.y;

    this._rect = this._drawRect((xOffset - offset) / this.designerCanvas.scaleFactor, (yOffset - offset) / this.designerCanvas.scaleFactor, (itemRect.width + offset + offset) / this.designerCanvas.scaleFactor, (itemRect.height + offset + offset) / this.designerCanvas.scaleFactor, 'svg-hover', this._rect);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}