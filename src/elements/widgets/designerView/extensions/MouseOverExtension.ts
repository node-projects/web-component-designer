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

    const xOffset = itemRect.x - this.designerView.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerView.containerBoundingRect.y;

    this._rect = this._drawRect(xOffset - offset, yOffset - offset, itemRect.width + offset + offset, itemRect.height + offset + offset, 'svg-hover', this._rect);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}