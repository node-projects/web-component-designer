import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PositionExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;
  private _rectX: SVGRectElement;
  private _textX: SVGTextElement;
  private _rectY: SVGRectElement;
  private _textY: SVGTextElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const itemParentRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element.parentElement);

    this._line1 = this._drawLine(itemParentRect.x, itemRect.y + itemRect.height / 2, itemRect.x, itemRect.y + itemRect.height / 2, 'svg-position', this._line1);
    this._line2 = this._drawLine(itemParentRect.x + itemParentRect.width, itemRect.y + itemRect.height / 2, itemRect.x + itemRect.width, itemRect.y + itemRect.height / 2, 'svg-position', this._line2);
    this._line3 = this._drawLine(itemRect.x + itemRect.width / 2, itemParentRect.y, itemRect.x + itemRect.width / 2, itemRect.y, 'svg-position', this._line3);
    this._line4 = this._drawLine(itemRect.x + itemRect.width / 2, itemParentRect.y + itemParentRect.height, itemRect.x + itemRect.width / 2, itemRect.y + itemRect.height, 'svg-position', this._line4);
    this._line1.style.strokeWidth = '' + (1 / this.designerCanvas.scaleFactor);
    this._line2.style.strokeWidth = '' + (1 / this.designerCanvas.scaleFactor);
    this._line3.style.strokeWidth = '' + (1 / this.designerCanvas.scaleFactor);
    this._line4.style.strokeWidth = '' + (1 / this.designerCanvas.scaleFactor);
    this._line1.style.strokeDasharray = '' + (4 / this.designerCanvas.scaleFactor);
    this._line2.style.strokeDasharray = '' + (4 / this.designerCanvas.scaleFactor);
    this._line3.style.strokeDasharray = '' + (4 / this.designerCanvas.scaleFactor);
    this._line4.style.strokeDasharray = '' + (4 / this.designerCanvas.scaleFactor);

    let x = Math.round(itemRect.x - itemParentRect.x);
    let y = Math.round(itemRect.y - itemParentRect.y);
    this._rectX = this._drawRect(itemParentRect.x + x / 2 - 10, itemRect.y + itemRect.height / 2 - 8, 20, 16, 'svg-position-text-rect', this._rectX);
    this._textX = this._drawText('' + x, itemParentRect.x + x / 2 - 9, itemRect.y + itemRect.height / 2 + 4, null, this._textX);
    this._textX.style.fontSize = '12px';
    this._rectY = this._drawRect(itemRect.x + itemRect.width / 2 - 10, itemParentRect.y + y / 2 - 8, 20, 16, 'svg-position-text-rect', this._rectY);
    this._textY = this._drawText('' + y, itemRect.x + itemRect.width / 2 - 10, itemParentRect.y + y / 2 + 4, null, this._textY);
    this._textY.style.fontSize = '12px';
  }

  override dispose() {
    this._removeAllOverlays();
  }
}