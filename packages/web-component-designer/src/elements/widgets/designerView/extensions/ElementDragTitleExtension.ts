import { getTextWidth } from '../../../helper/TextHelper.js';
import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from '../tools/ITool.js';
import { NamedTools } from "../tools/NamedTools.js";
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

const extensionWidth = 60;

export class ElementDragTitleExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _text: SVGForeignObjectElement;
  private _width: number;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas, cache);
    if (!isNaN(transformedCornerPoints[0].x)) {
      const boundRect = this.extendedItem.element.getBoundingClientRect();
      let w = getTextWidth(this.extendedItem.name, '10px monospace');
      let elementWidth = Math.sqrt(Math.pow(transformedCornerPoints[1].x - transformedCornerPoints[0].x, 2) + Math.pow(transformedCornerPoints[1].y - transformedCornerPoints[0].y, 2));
      let text = this.extendedItem.name;
      this._width = Math.max(Math.min(elementWidth, w), extensionWidth);
      this._rect = this._drawRect(transformedCornerPoints[0].x, transformedCornerPoints[0].y - 16, this._width, 15, 'svg-primary-selection-move', this._rect);
      this._text = this._drawHTML('<div style="position:relative"><span style="width: 100%; position: absolute; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transform-origin: 0 0;">' + text + '</span></div>', (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, transformedCornerPoints[0].y - 16, this._width, 15, 'svg-text-primary', this._text);
      this._text.style.overflow = 'visible';
      this._rect.addEventListener('pointerdown', (e) => this._pointerEvent(e));
      this._rect.addEventListener('pointermove', (e) => this._pointerEvent(e));
      this._rect.addEventListener('pointerup', (e) => this._pointerEvent(e));
      this.refresh(cache, event);
    }
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, { x: 0, y: 16 }, this.designerCanvas, cache);
    const angle = Math.atan2((transformedCornerPoints[1].y - transformedCornerPoints[0].y), (transformedCornerPoints[1].x - transformedCornerPoints[0].x)) * 180 / Math.PI;

    if (!isNaN(transformedCornerPoints[0].x)) {
      if (this._valuesHaveChanges(transformedCornerPoints[0].x, transformedCornerPoints[0].y, angle)) {
        const h = (15 / this.designerCanvas.scaleFactor);
        const w = (this._width / this.designerCanvas.scaleFactor);
        this._rect.setAttribute('x', '' + transformedCornerPoints[0].x);
        this._rect.setAttribute('y', '' + transformedCornerPoints[0].y);
        this._rect.style.rotate = angle + 'deg';
        this._rect.style.transformBox = 'fill-box'
        this._rect.setAttribute('height', '' + h);
        this._rect.setAttribute('width', '' + w);
        this._rect.style.strokeWidth = (1 / this.designerCanvas.scaleFactor).toString();
        this._text.setAttribute('x', '' + transformedCornerPoints[0].x);
        this._text.setAttribute('y', '' + transformedCornerPoints[0].y);
        this._text.style.fontSize = (10 / this.designerCanvas.scaleFactor) + 'px';
        this._text.setAttribute('height', '' + h);
        this._text.setAttribute('width', '' + w);
        (<HTMLElement>this._text.children[0].children[0]).style.rotate = angle + 'deg';
      }
    }
  }

  _pointerEvent(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    (<ITool>this.designerCanvas.serviceContainer.designerTools.get(NamedTools.Pointer)).pointerEventHandler(this.designerCanvas, event, this.extendedItem.element);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}