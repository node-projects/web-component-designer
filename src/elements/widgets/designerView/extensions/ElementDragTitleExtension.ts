import { getTextWidth } from "../../../helper/TextHelper";
import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { NamedTools } from "../tools/NamedTools.js";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

const extensionWidth = 60;

export class ElementDragTitleExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _text: SVGTextElement;
  private _width: number;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas);
    const boundRect = this.extendedItem.element.getBoundingClientRect();
    let w = getTextWidth(this.extendedItem.name, '10px monospace');
    let elementWidth = Math.sqrt(Math.pow(transformedCornerPoints[1].x - transformedCornerPoints[0].x, 2) + Math.pow(transformedCornerPoints[1].y - transformedCornerPoints[0].y, 2));
    let text = this.extendedItem.name;
    this._width = Math.max(Math.min(elementWidth, w), extensionWidth);
    if (w > this._width)
      text = this.extendedItem.name.substring(0, 10) + '…'
    this._rect = this._drawRect(transformedCornerPoints[0].x, transformedCornerPoints[0].y - 16, this._width, 15, 'svg-primary-selection-move', this._rect);
    this._text = this._drawText(text, (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 5, 'svg-text-primary', this._text);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = this.extendedItem.name;
    this._text.appendChild(title);
    this._rect.addEventListener('pointerdown', (e) => this._pointerEvent(e));
    this._rect.addEventListener('pointermove', (e) => this._pointerEvent(e));
    this._rect.addEventListener('pointerup', (e) => this._pointerEvent(e));
    this.refresh();
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh() {
    const transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, { x: 0, y: 16 }, this.designerCanvas);
    const angle = Math.atan2((transformedCornerPoints[1].y - transformedCornerPoints[0].y), (transformedCornerPoints[1].x - transformedCornerPoints[0].x)) * 180 / Math.PI;
    const transformedCornerPointsTx = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, { x: 0, y: 5 }, this.designerCanvas);

    const h = (15 / this.designerCanvas.scaleFactor);
    const w = (this._width / this.designerCanvas.scaleFactor);
    this._rect.setAttribute('x', '' + transformedCornerPoints[0].x);
    this._rect.setAttribute('y', '' + transformedCornerPoints[0].y);
    this._rect.style.rotate = angle + 'deg';
    this._rect.style.transformBox = 'fill-box'
    this._rect.setAttribute('height', '' + h);
    this._rect.setAttribute('width', '' + w);
    this._rect.style.strokeWidth = (1 / this.designerCanvas.scaleFactor).toString();
    this._text.setAttribute('x', '' + transformedCornerPointsTx[0].x);
    this._text.setAttribute('y', '' + transformedCornerPointsTx[0].y);
    this._text.style.fontSize = (10 / this.designerCanvas.scaleFactor) + 'px';
    this._text.setAttribute('transform', 'rotate(' + angle + ' ' + transformedCornerPointsTx[0].x + ' ' + transformedCornerPointsTx[0].y + ')');
  }

  _pointerEvent(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.designerCanvas.serviceContainer.designerTools.get(NamedTools.Pointer).pointerEventHandler(this.designerCanvas, event, this.extendedItem.element);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}