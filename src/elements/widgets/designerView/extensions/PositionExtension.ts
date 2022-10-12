import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PositionExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;
  private _textX: [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement];
  private _textY: [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement];

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
    this._textX = this._drawTextWithBackground('' + x, itemParentRect.x + x / 2, itemRect.y + itemRect.height / 2, 'white', 'svg-position-text', this._textX);
    this._textX[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
    this._textX[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
    this._textY = this._drawTextWithBackground('' + y, itemRect.x + itemRect.width / 2, itemParentRect.y + y / 2, 'white', 'svg-position-text', this._textY);
    this._textY[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
    this._textY[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';

+++ Check this after merge +++
    const xOffset = itemRect.x - this.designerCanvas.containerBoundingRect.x;
    const yOffset = itemRect.y - this.designerCanvas.containerBoundingRect.y;

    let left = Number.parseFloat(computedStyle.left.replace('px', ''));
    if (isNaN(left))
      left = 0;
    let top = Number.parseFloat(computedStyle.top.replace('px', ''));
    if (isNaN(top))
      top = 0;
    let right = Number.parseFloat(computedStyle.right.replace('px', ''));
    if (isNaN(right))
      right = 0;
    let bottom = Number.parseFloat(computedStyle.bottom.replace('px', ''));
    if (isNaN(bottom))
      bottom = 0;

    let tx = 0;
    let ty = 0;
    // if (computedStyle.transform !== 'none') {
    //   const transforms = computedStyle.transform.replace('matrix(', '').split(',');
    //   tx = Number.parseFloat(transforms[4]);
    //   ty = Number.parseFloat(transforms[5].replace(')', ''));
    // }

    this._line1 = this._drawLine((xOffset / this.designerCanvas.scaleFactor - left - tx), (yOffset + itemRect.height / 2) / this.designerCanvas.scaleFactor, xOffset / this.designerCanvas.scaleFactor, (yOffset + itemRect.height / 2) / this.designerCanvas.scaleFactor, 'svg-position', this._line1);
    this._line2 = this._drawLine((xOffset + itemRect.width / 2) / this.designerCanvas.scaleFactor, (yOffset / this.designerCanvas.scaleFactor) - top - ty, (xOffset + itemRect.width / 2) / this.designerCanvas.scaleFactor, yOffset / this.designerCanvas.scaleFactor, 'svg-position', this._line2);
    this._line3 = this._drawLine((xOffset + itemRect.width) / this.designerCanvas.scaleFactor, (yOffset + itemRect.height / 2) / this.designerCanvas.scaleFactor, (xOffset + itemRect.width + right + -1 * tx)/ this.designerCanvas.scaleFactor, (yOffset + itemRect.height / 2) / this.designerCanvas.scaleFactor, 'svg-position', this._line3);
    this._line4 = this._drawLine((xOffset + itemRect.width / 2) / this.designerCanvas.scaleFactor, (yOffset + itemRect.height) / this.designerCanvas.scaleFactor, (xOffset + itemRect.width / 2) / this.designerCanvas.scaleFactor, (yOffset + itemRect.height + bottom + -1 * ty) / this.designerCanvas.scaleFactor, 'svg-position', this._line4);
+++ Check this after merge +++
  }

  override dispose() {
    this._removeAllOverlays();
  }
}