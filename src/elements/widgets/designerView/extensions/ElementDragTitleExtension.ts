import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class ElementDragTitleExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _text: SVGTextElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const boundRect = this.extendedItem.element.getBoundingClientRect();
    this._rect = this._drawRect((boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 16, 60, 15, 'svg-primary-selection-move', this._rect);
    this._text = this._drawText(this.extendedItem.name.substring(0, 10) + '…', (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 5, 'svg-text-primary', this._text);
    this._rect.addEventListener('pointerdown', (e) => this._pointerEvent(e));
    this._rect.addEventListener('pointermove', (e) => this._pointerEvent(e));
    this._rect.addEventListener('pointerup', (e) => this._pointerEvent(e));
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh() {
    const boundRect = this.extendedItem.element.getBoundingClientRect();
    const xr = (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor;
    const yr = (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 16;
    this._rect.setAttribute('x', <string><any>xr);
    this._rect.setAttribute('y', <string><any>yr);
    const x = (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor;
    const y = (boundRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor - 5;
    this._text.setAttribute('x', <string><any>x);
    this._text.setAttribute('y', <string><any>y);
  }

  _pointerEvent(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    //@ts-ignore
    (<DesignerCanvas>this.designerCanvas)._pointerEventHandlerBound(event, this.extendedItem.element);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}