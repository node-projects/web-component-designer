import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayer } from "./OverlayLayer.js";

export class AltToEnterContainerExtension extends AbstractExtension {

  private _text: SVGTextElement;
  
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    this._text = this._drawText("Press ALT to enter container", itemRect.x + 5, itemRect.y + 12, 'svg-text-enter-container', this._text, OverlayLayer.Foregorund);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}