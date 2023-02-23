import { EventNames } from "../../../../../enums/EventNames.js";
import { convertCssUnit, convertCssUnitToPixel, getCssUnit } from "../../../../helper/CssUnitConverter.js";
import { CalculateGridInformation } from "../../../../helper/GridHelper.js";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";

export class EditGridColumnRowSizesExtension extends AbstractExtension {

  gridInformation: ReturnType<typeof CalculateGridInformation>;

  private _resizers: SVGRectElement[] = [];
  private _initalPos: number;
  private _initialSizes: string;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(event?: Event) {
    this.refresh(event);
  }

  override refresh(event?: Event) {
    this.gridInformation = CalculateGridInformation(this.extendedItem);

    this.gridInformation.gaps.forEach((gap, i) => {
      if (gap.width < 3) { gap.width = 3; gap.x--; }
      if (gap.height < 3) { gap.height = 3; gap.y--; }
      let rect = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-resizer-' + gap.type, this._resizers[i], OverlayLayer.Normal);
      if (!this._resizers[i]) {
        this._resizers[i] = rect;
        rect.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(event, rect, gap));
        rect.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(event, rect, gap));
        rect.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(event, rect, gap));
      }
    });
  }

  _pointerActionTypeResize(event: PointerEvent, rect: SVGRectElement, gap: ReturnType<typeof CalculateGridInformation>['gaps'][0]) {
    event.stopPropagation();

    const templatePropertyName = gap.type == 'h' ? 'gridTemplateRows' : 'gridTemplateColumns';
    const axisPropertyName = gap.type == 'h' ? 'Y' : 'X';
    const index = (gap.type == 'h' ? gap.row : gap.column) - 1;
    const sizeType = gap.type == 'h' ? 'height' : 'width';
    const pos = event['client' + axisPropertyName];
    switch (event.type) {
      case EventNames.PointerDown:
        rect.setPointerCapture(event.pointerId);
        this._initalPos = pos;
        this._initialSizes = getComputedStyle(this.extendedItem.element)[templatePropertyName];
        break;
      case EventNames.PointerMove:
        if (this._initialSizes) {
          const diff = this._initalPos - pos;
          let parts = this._initialSizes.split(' ');
          parts[index] = (parseFloat(parts[index]) - diff) + 'px';
          parts[index + 1] = (parseFloat(parts[index + 1]) + diff) + 'px';
          (<HTMLElement>this.extendedItem.element).style[templatePropertyName] = parts.join(' ');
          this.extensionManager.refreshExtensions([this.extendedItem], null, event);
        }
        break;
      case EventNames.PointerUp:
        rect.releasePointerCapture(event.pointerId);
        const diff = this._initalPos - pos;
        const realStyle = this.extendedItem.getStyleFromSheetOrLocalOrComputed(templatePropertyName);
        const initialParts = this._initialSizes.split(' ');
        const parts = realStyle.split(' ');
        let units = parts.map(x => getCssUnit(x));
        if (parts.length != initialParts.length) {
          units = initialParts.map(x => getCssUnit(x));
        }
        (<HTMLElement>this.extendedItem.element).style[templatePropertyName] = '';
        const unit1 = units[index];
        initialParts[index] = this._convertCssUnitIncludingFr(parseFloat(initialParts[index]) - diff, <HTMLElement>this.extendedItem.element, sizeType, unit1, units);
        const unit2 = units[index + 1];
        initialParts[index + 1] = this._convertCssUnitIncludingFr(parseFloat(initialParts[index + 1]) + diff, <HTMLElement>this.extendedItem.element, sizeType, unit2, units);
        this.extendedItem.updateStyleInSheetOrLocal(templatePropertyName, initialParts.join(' '));

        this._initalPos = null;
        this._initialSizes = null;
        this.extensionManager.refreshExtensions([this.extendedItem]);
        break;
    }
  }

  _convertCssUnitIncludingFr(cssValue: string | number, target: HTMLElement, percentTarget: 'width' | 'height', unit: string, units: string[]): string {
    if (unit == "fr") {
      let containerSize = convertCssUnitToPixel(target.style.width, target, percentTarget);
      let amountGaps = percentTarget == "height" ? this.gridInformation.cells.length - 1 : this.gridInformation.cells[0].length - 1
      let gapSize = convertCssUnitToPixel(percentTarget == "width" ? target.style.columnGap : target.style.rowGap, target, percentTarget) ?? 0;
      let containerSizeWithoutGaps = containerSize - gapSize * amountGaps;

      let amountFrSizes = 0;
      let leftOver = containerSizeWithoutGaps;
      this.gridInformation.cells[0].forEach((column, i) => {
        if (units[i] == "fr")
          amountFrSizes++;
        else
          leftOver -= column[percentTarget];
      })

      let frRatio = leftOver / amountFrSizes;
      if (typeof cssValue == "number") {
        //expected Value in Pixel
        return (cssValue / frRatio).toFixed(2) + "fr";
      }
      else {
        return (convertCssUnitToPixel(cssValue, target, percentTarget) / frRatio).toFixed(2) + "fr"
      }
    }
    else
      return convertCssUnit(cssValue, target, percentTarget, unit);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}