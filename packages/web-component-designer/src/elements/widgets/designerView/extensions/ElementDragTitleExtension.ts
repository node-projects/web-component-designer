import { getBoundingClientRectAlsoForDisplayContents } from '../../../helper/ElementHelper.js';
import { getTextWidth } from '../../../helper/TextHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from '../tools/ITool.js';
import { NamedTools } from "../tools/NamedTools.js";
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

const extensionWidth = 60;

export class ElementDragTitleExtension extends AbstractExtension {
  private _rect: SVGRectElement;
  private _clickRect: SVGRectElement;
  private _text: SVGForeignObjectElement;
  private _width: number;
  private _createTitleText: (designItem: IDesignItem) => string;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, createTitleText?: (designItem: IDesignItem) => string) {
    super(extensionManager, designerView, extendedItem);
    this._createTitleText = createTitleText;
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (!transformedCornerPoints)
      return;

    if (!isNaN(transformedCornerPoints.p1.x)) {
      const boundRect = getBoundingClientRectAlsoForDisplayContents(this.extendedItem.element);
      let w = getTextWidth(this.extendedItem.name, '10px monospace');
      let elementWidth = Math.sqrt(Math.pow(transformedCornerPoints.p2.x - transformedCornerPoints.p1.x, 2) + Math.pow(transformedCornerPoints.p2.y - transformedCornerPoints.p1.y, 2));
      let text = this.extendedItem.name;
      if (this.extendedItem.id)
        text = '#' + this.extendedItem.id;
      if (this._createTitleText)
        text = this._createTitleText(this.extendedItem);
      this._width = Math.max(Math.min(elementWidth, w), extensionWidth);
      this._rect = this._drawRect(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, this._width, 15, 'svg-primary-selection-move', this._rect);
      this._clickRect = this._drawRect(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, this._width, 18, 'svg-invisible', this._clickRect);
      this._clickRect.style.background = 'transparent';
      this._text = this._drawHTML('<div style="position:relative; pointer-events: none;"><span style="width: 100%; position: absolute; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transform-origin: 0 0; padding-left: 2px;">' + text + '</span></div>', (boundRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor, transformedCornerPoints.p1.y - 16, this._width, 15, 'svg-text-primary', this._text);
      this._text.style.overflow = 'visible';

      this._clickRect.addEventListener('pointerdown', (e) => this._pointerEvent(e));
      this._clickRect.addEventListener('pointermove', (e) => this._pointerEvent(e));
      this._clickRect.addEventListener('pointerup', (e) => this._pointerEvent(e));
      this._clickRect.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.designerCanvas.showDesignItemContextMenu(this.extendedItem, e);
      });
      this.refresh(cache, event);
    }
  }

  _drawMoveOverlay(itemRect: DOMRect) {
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (!isNaN(transformedCornerPoints.p1.x)) {
      const angle = Math.atan2((transformedCornerPoints.p2.y - transformedCornerPoints.p1.y), (transformedCornerPoints.p2.x - transformedCornerPoints.p1.x)) * 180 / Math.PI;
      if (this._valuesHaveChanges(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, angle, this.designerCanvas.scaleFactor)) {
        const h = (15 / this.designerCanvas.scaleFactor);
        const o = -(16 / this.designerCanvas.scaleFactor);
        const w = (this._width / this.designerCanvas.scaleFactor);
        this._rect.setAttribute('x', '' + transformedCornerPoints.p1.x);
        this._rect.setAttribute('y', '' + transformedCornerPoints.p1.y);
        this._rect.style.rotate = angle + 'deg';
        this._rect.style.translate = '0 ' + o + 'px';
        this._rect.style.transformOrigin = '0 100%';
        this._rect.style.transformBox = 'fill-box';
        this._rect.setAttribute('height', '' + h);
        this._rect.setAttribute('width', '' + w);
        this._rect.style.strokeWidth = (1 / this.designerCanvas.scaleFactor).toString();
        this._clickRect.setAttribute('x', '' + transformedCornerPoints.p1.x);
        this._clickRect.setAttribute('y', '' + transformedCornerPoints.p1.y);
        this._clickRect.style.rotate = angle + 'deg';
        this._clickRect.style.translate = '0 ' + o + 'px';
        this._clickRect.style.transformOrigin = '0 100%';
        this._clickRect.style.transformBox = 'fill-box';
        this._clickRect.setAttribute('height', '' + (h + 3));
        this._clickRect.setAttribute('width', '' + w);
        this._clickRect.style.strokeWidth = (1 / this.designerCanvas.scaleFactor).toString();
        this._text.setAttribute('x', '' + transformedCornerPoints.p1.x);
        this._text.setAttribute('y', '' + transformedCornerPoints.p1.y);
        this._text.style.fontSize = (10 / this.designerCanvas.scaleFactor) + 'px';
        this._text.setAttribute('height', '' + h);
        this._text.setAttribute('width', '' + w);
        (<HTMLElement>this._text.children[0].children[0]).style.rotate = angle + 'deg';
        (<HTMLElement>this._text.children[0].children[0]).style.translate = '0 ' + o + 'px';
        (<HTMLElement>this._text.children[0].children[0]).style.transformOrigin = '0 100%';
      }
    }
  }

  _pointerEvent(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.button != 2)
      (<ITool>this.designerCanvas.serviceContainer.designerTools.get(NamedTools.Pointer)).pointerEventHandler(this.designerCanvas, event, this.extendedItem.element);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}