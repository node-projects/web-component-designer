import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

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

  _oldValues = [];
  override refresh() {

    //TODO: show wich position is docked (no dashed line, but full). klick on value disables or enables docking? Disabling enables parent side, enabling both removes width or height.

    const itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const itemParentRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.parent.element);

    if (this._valuesHaveChanges(this.designerCanvas.scaleFactor, itemRect.x, itemRect.y, itemParentRect.x, itemParentRect.y, itemRect.height, itemRect.width, itemParentRect.height, itemParentRect.width)) {
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

      let rightIsUnit, bottomIsUnit;
      if (this.extendedItem.element.computedStyleMap) {
        const cm = this.extendedItem.element.computedStyleMap();
        rightIsUnit = cm.get('right') instanceof CSSUnitValue;
        bottomIsUnit = cm.get('bottom') instanceof CSSUnitValue;
      } else {
        rightIsUnit = !!(<HTMLElement>this.extendedItem.element)?.style?.right;
        bottomIsUnit = !!(<HTMLElement>this.extendedItem.element)?.style?.bottom;
      }

      if (!rightIsUnit) {
        let x = Math.round(itemRect.x - itemParentRect.x);
        this._textX = this._drawTextWithBackground('' + x, itemParentRect.x + x / 2, itemRect.y + itemRect.height / 2, 'white', 'svg-position-text', this._textX);
        this._textX[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
        this._textX[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
      } else {
        let x = Math.round(itemParentRect.x + itemParentRect.width - (itemRect.x + itemRect.width));
        this._textX = this._drawTextWithBackground('' + x, itemParentRect.x + itemParentRect.width - x / 2, itemRect.y + itemRect.height / 2, 'white', 'svg-position-text', this._textX);
        this._textX[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
        this._textX[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
      }

      if (!bottomIsUnit) {
        let y = Math.round(itemRect.y - itemParentRect.y);
        this._textY = this._drawTextWithBackground('' + y, itemRect.x + itemRect.width / 2, itemParentRect.y + y / 2, 'white', 'svg-position-text', this._textY);
        this._textY[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
        this._textY[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
      } else {
        let y = Math.round(itemParentRect.y + itemParentRect.height - (itemRect.y + itemRect.height));
        this._textY = this._drawTextWithBackground('' + y, itemRect.x + itemRect.width / 2, itemParentRect.y + itemParentRect.height - y / 2, 'white', 'svg-position-text', this._textY);
        this._textY[2].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
        this._textY[3].style.fontSize = (12 / this.designerCanvas.scaleFactor) + 'px';
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}