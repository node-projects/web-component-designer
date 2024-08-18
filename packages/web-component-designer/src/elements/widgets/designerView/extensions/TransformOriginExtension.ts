import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { convertCssUnit, getCssUnit } from '../../../helper/CssUnitConverter.js';
import { roundValue } from '../../../helper/LayoutHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class TransformOriginExtension extends AbstractExtension {
  private _startPos: IPoint;
  private _circle: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _oldValue: string;
  private _offsetInControl: { x: number; y: number; };

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' ');
    const toDOMPoint = this.designerCanvas.canvas.convertPointFromNode({ x: parseFloat(to[0]), y: parseFloat(to[1]) }, this.extendedItem.element);
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
      this._circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event));
    }
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' ');
    const toDOMPoint = this.designerCanvas.canvas.convertPointFromNode({ x: parseFloat(to[0]), y: parseFloat(to[1]) }, this.extendedItem.element);
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
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' ');
    const toInPercentage = [];
    toInPercentage[0] = parseFloat(to[0]) / parseFloat((<HTMLElement>this.extendedItem.element).style.width);
    toInPercentage[1] = parseFloat(to[1]) / parseFloat((<HTMLElement>this.extendedItem.element).style.height);
    const toDOMPoint = this.designerCanvas.canvas.convertPointFromNode({ x: parseFloat(to[0]), y: parseFloat(to[1]) }, this.extendedItem.element);
    const mp = this.designerCanvas.getNormalizedEventCoordinates(event);
    const evPoint = this.extendedItem.element.convertPointFromNode(mp, this.designerCanvas.canvas);
    const normalized = this.designerCanvas.getNormalizedEventCoordinates(event);
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        const rect = (<HTMLElement>event.target).getBoundingClientRect();
        this._offsetInControl = { x: rect.width / 2 + (rect.x - event.x), y: rect.height / 2 + (rect.y - event.y) };
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
          evPoint.x += this._offsetInControl.x;
          evPoint.y += this._offsetInControl.y;
          const cg = this.extendedItem.openGroup('change transform-origin');
          const quadsOld = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.rootDesignItem.element })[0];
          if (this._oldValue) {
            try {
              const oldSplit = this._oldValue.split(' ');
              let newXs = convertCssUnit(evPoint.x, <HTMLElement>this.extendedItem.element, 'width', getCssUnit(oldSplit[0]));
              let newYs = convertCssUnit(evPoint.x, <HTMLElement>this.extendedItem.element, 'width', getCssUnit(oldSplit[0]));
              if (oldSplit.length > 1) {
                newYs = convertCssUnit(evPoint.y, <HTMLElement>this.extendedItem.element, 'height', getCssUnit(oldSplit[1]));
              }
              this.extendedItem.updateStyleInSheetOrLocal('transform-origin', newXs + ' ' + newYs);
            } catch (err) {
              this.extendedItem.updateStyleInSheetOrLocal('transform-origin', roundValue(this.extendedItem, evPoint.x) + 'px' + ' ' + roundValue(this.extendedItem, evPoint.y) + 'px');
            }
          }
          else
            this.extendedItem.updateStyleInSheetOrLocal('transform-origin', roundValue(this.extendedItem, evPoint.x) + 'px' + ' ' + roundValue(this.extendedItem, evPoint.y) + 'px');
          const quadsNew = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.rootDesignItem.element })[0];
          const translateP = { x: quadsOld.p1.x - quadsNew.p1.x, y: quadsOld.p1.y - quadsNew.p1.y };
          if (computed.translate && computed.translate !== 'none') {
            translateP.x += parseFloat(computed.translate.split(' ')[0])
            translateP.y += parseFloat(computed.translate.split(' ')[1])
          }
          this.extendedItem.updateStyleInSheetOrLocal('translate', roundValue(this.extendedItem, translateP.x) + 'px' + ' ' + roundValue(this.extendedItem, translateP.y) + 'px');
          cg.commit();
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