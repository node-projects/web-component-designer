import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class PrimarySelectionDefaultExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _text: SVGTextElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh() {
    const boundRect = this.extendedItem.element.getBoundingClientRect();
    this._rect = this._drawRect((boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 16, 60, 15, 'svg-primary-selection-move', this._rect);
    this._text = this._drawText(this.extendedItem.name.substring(0, 10) + '…', (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 5, 'svg-text-primary', this._text);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}