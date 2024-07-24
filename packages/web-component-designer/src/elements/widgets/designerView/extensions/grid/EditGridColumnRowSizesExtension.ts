import { EventNames } from "../../../../../enums/EventNames.js";
import { convertCssUnit, convertCssUnitToPixel, getCssUnit, getExpandedCssGridColumnSizes } from "../../../../helper/CssUnitConverter.js";
import { calculateGridInformation } from "../../../../helper/GridHelper.js";
import { getElementCombinedTransform } from "../../../../helper/getBoxQuads.js";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { OverlayLayer } from "../OverlayLayer.js";

export class EditGridColumnRowSizesExtension extends AbstractExtension {

  gridInformation: ReturnType<typeof calculateGridInformation>;

  private _resizers: SVGRectElement[] = [];
  private _initalPos: number;
  private _initialSizes: string;
  private _group: SVGGElement;
  private _hasChanged: boolean;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this._group = this._drawGroup(null, this._group, OverlayLayer.Background);
    this._group.style.transform = getElementCombinedTransform(<HTMLElement>this.extendedItem.element).toString();
    this._group.style.transformOrigin = '0 0';
    this._group.style.transformBox = 'fill-box';

    this.refresh(event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    this.gridInformation = calculateGridInformation(this.extendedItem);
    this.gridInformation.gaps.forEach((gap, i) => {
      if (gap.width < 3) { gap.width = 3; gap.x--; }
      if (gap.height < 3) { gap.height = 3; gap.y--; }
      let rect = this._drawRect(gap.x, gap.y, gap.width, gap.height, 'svg-grid-resizer-' + gap.type, this._resizers[i], OverlayLayer.Normal);
      if (!this._resizers[i]) {
        this._resizers[i] = rect;
        rect.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(event, rect, gap));
        rect.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(event, rect, gap));
        rect.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(event, rect, gap));
        this._group.appendChild(rect);
      }
    });
  }

  private _pointerActionTypeResize(event: PointerEvent, rect: SVGRectElement, gap: ReturnType<typeof calculateGridInformation>['gaps'][0]) {
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
          if (Math.abs(diff) > 5 || this._hasChanged) {
            this._hasChanged = true;
            let parts = this._initialSizes.split(' ');
            parts[index] = (parseFloat(parts[index]) - diff) + 'px';
            parts[index + 1] = (parseFloat(parts[index + 1]) + diff) + 'px';
            (<HTMLElement>this.extendedItem.element).style[templatePropertyName] = parts.join(' ');
            this.extensionManager.refreshExtensions([this.extendedItem], null, event);
          }
        }
        break;
      case EventNames.PointerUp:
        rect.releasePointerCapture(event.pointerId);
        const diff = this._initalPos - pos;
        if (this._hasChanged) {
          this._hasChanged = false;
          const realStyle = this.extendedItem.getStyleFromSheetOrLocalOrComputed(templatePropertyName);
          const initialParts = this._initialSizes.split(' ');
          let units = getExpandedCssGridColumnSizes(realStyle);
          if (units.length != initialParts.length) {
            units = initialParts.map(x => getCssUnit(x));
          }
          (<HTMLElement>this.extendedItem.element).style[templatePropertyName] = '';

          const targetPixelSizes = initialParts.map(x => parseFloat(x));
          targetPixelSizes[index] -= diff;
          targetPixelSizes[index + 1] += diff;
          const newSizes = this._convertCssUnits(targetPixelSizes, units, <HTMLElement>this.extendedItem.element, sizeType);

          this.extendedItem.updateStyleInSheetOrLocal(templatePropertyName, newSizes.join(' '), null, true);
        }
        this._initalPos = null;
        this._initialSizes = null;
        this.extensionManager.refreshExtensions([this.extendedItem]);
        break;
    }
  }

  private _convertCssUnits(pixelSizes: number[], targetUnits: string[], target: HTMLElement, percentTarget: 'width' | 'height'): string[] {
    let cp = getComputedStyle(target);
    let bounding = target.getBoundingClientRect();
    let containerSize = bounding[percentTarget];
    let amountGaps = percentTarget == "height" ? this.gridInformation.cells.length - 1 : this.gridInformation.cells[0].length - 1;
    let gapValue = percentTarget == "width" ? cp.columnGap : cp.rowGap;
    if (gapValue == "normal")
      gapValue = '0px';
    let gapSize = convertCssUnitToPixel(gapValue, target, percentTarget) ?? 0;
    let containerSizeWithoutGaps = containerSize - gapSize * amountGaps;
    let sizeForFrs = containerSizeWithoutGaps;

    for (let i = 0; i < pixelSizes.length; i++) {
      if (targetUnits[i] != 'fr')
        sizeForFrs -= pixelSizes[i];
    }

    let result: string[] = [];
    for (let i = 0; i < pixelSizes.length; i++) {
      if (targetUnits[i] != 'fr') {
        result.push(convertCssUnit(pixelSizes[i], target, percentTarget, targetUnits[i]));
      } else {
        result.push(((pixelSizes[i] / sizeForFrs) * 10).toFixed(2) + 'fr');
      }
    }
    return result;
  }

  override dispose() {
    this._removeAllOverlays();
  }
}