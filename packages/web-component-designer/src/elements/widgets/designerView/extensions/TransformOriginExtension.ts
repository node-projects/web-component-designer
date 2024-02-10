import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { convertCssUnit, getCssUnit } from '../../../helper/CssUnitConverter.js';
import { getDesignerCanvasNormalizedTransformedPoint } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class TransformOriginExtension extends AbstractExtension {
  private _startPos: IPoint;
  private _circle: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _oldValue: string;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }


  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' '); // This value remains the same regardless of scalefactor
    const toDOMPoint = getDesignerCanvasNormalizedTransformedPoint(<HTMLElement>this.extendedItem.element, { x: parseFloat(to[0]) * this.designerCanvas.zoomFactor, y: parseFloat(to[1]) * this.designerCanvas.zoomFactor }, this.designerCanvas, cache);

    if (this._valuesHaveChanges(toDOMPoint.x, toDOMPoint.y, this.designerCanvas.zoomFactor)) {
      this._removeAllOverlays();
      this._circle = this._drawCircle(toDOMPoint.x, toDOMPoint.y, 5 / this.designerCanvas.zoomFactor, 'svg-transform-origin');
      this._circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
      this._circle.style.cursor = 'pointer';

      this._circle2 = this._drawCircle(toDOMPoint.x, toDOMPoint.y, 1 / this.designerCanvas.zoomFactor, 'svg-transform-origin');
      this._circle2.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
      this._circle2.style.pointerEvents = 'none';
      this._circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event));
      this._circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event));
      this._circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event)); //TODO: -> assign to window
    }
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' '); // This value remains the same regardless of scalefactor
    const toDOMPoint = getDesignerCanvasNormalizedTransformedPoint(<HTMLElement>this.extendedItem.element, { x: parseFloat(to[0]) * this.designerCanvas.zoomFactor, y: parseFloat(to[1]) * this.designerCanvas.zoomFactor }, this.designerCanvas, cache);
    if (isNaN(toDOMPoint.x) || isNaN(toDOMPoint.y)) {
      this.remove();
      return;
    } else {
      let old = this.extendedItem.getStyleFromSheetOrLocal('transform-origin');
      if (old) {
        this._oldValue = old;
      }
      this.refresh(cache, event);
    }
  }

  pointerEvent(event: PointerEvent) {
    event.stopPropagation();

    const rect = this.designerCanvas.getNormalizedElementCoordinates(<HTMLElement>this.extendedItem.element);
    const computed = getComputedStyle(this.extendedItem.element);
    const x = 0;
    const y = 1;
    const to = computed.transformOrigin.split(' '); // This value remains the same regardless of scalefactor
    const toInPercentage = [];
    toInPercentage[0] = parseFloat(to[0]) / parseFloat((<HTMLElement>this.extendedItem.element).style.width); // This value remains the same regardless of scalefactor
    toInPercentage[1] = parseFloat(to[1]) / parseFloat((<HTMLElement>this.extendedItem.element).style.height); // This value remains the same regardless of scalefactor

    const toDOMPoint = new DOMPoint(rect.x + toInPercentage[x] * rect.width, rect.y + toInPercentage[y] * rect.height)

    const normalized = this.designerCanvas.getNormalizedEventCoordinates(event);
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._startPos = { x: normalized.x, y: normalized.y };
        break;
      case EventNames.PointerMove:
        if (this._startPos && event.buttons > 0) {
          const dx = normalized.x - this._startPos.x;
          const dy = normalized.y - this._startPos.y;
          this._circle.setAttribute('cx', <any>(toDOMPoint.x + dx));
          this._circle.setAttribute('cy', <any>(toDOMPoint.y + dy));
          this._circle2.setAttribute('cx', <any>(toDOMPoint.x + dx));
          this._circle2.setAttribute('cy', <any>(toDOMPoint.y + dy));
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);

        if (this._startPos) {
          const dx = normalized.x - this._startPos.x;
          const dy = normalized.y - this._startPos.y;
          const newX = (dx + parseFloat(to[x]));
          const newY = (dy + parseFloat(to[y]));
          if (this._oldValue) { //Restore old units
            try {
              const oldSplit = this._oldValue.split(' ');
              let newXs = convertCssUnit(newX, <HTMLElement>this.extendedItem.element, 'width', getCssUnit(oldSplit[0]));
              let newYs = convertCssUnit(newX, <HTMLElement>this.extendedItem.element, 'width', getCssUnit(oldSplit[0]));
              if (oldSplit.length > 1) {
                newYs = convertCssUnit(newY, <HTMLElement>this.extendedItem.element, 'height', getCssUnit(oldSplit[1]));
              }
              this.extendedItem.updateStyleInSheetOrLocal('transform-origin', newXs + ' ' + newYs);
            } catch (err) {
              this.extendedItem.updateStyleInSheetOrLocal('transform-origin', newX + 'px' + ' ' + newY + 'px');
            }
          }
          else
            this.extendedItem.updateStyleInSheetOrLocal('transform-origin', newX + 'px' + ' ' + newY + 'px');
          this.refresh(null, null);
          this._startPos = null;
        }
        break;
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}