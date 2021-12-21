import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import "../../../helper/PathDataPolyfill";
import { IPoint } from "../../../../interfaces/IPoint";
import { IExtensionManager } from "./IExtensionManger";
import { EventNames } from "../../../../enums/EventNames";

export class PathExtension extends AbstractExtension {
  //private _itemRect: DOMRect;
  //private _svgRect: DOMRect;
  private _lastPos: IPoint
  private _parentRect: DOMRect;
  private _circle: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _startPos: IPoint;

  private _rect: DOMRect;
  private _computed: CSSStyleDeclaration;
  private _to: string[];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(): void {
    //this._itemRect = this.extendedItem.element.getBoundingClientRect();
    //this._svgRect = (<SVGGeometryElement>this.extendedItem.element).ownerSVGElement.getBoundingClientRect();
    this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
    const pathdata: any = (<SVGGraphicsElement>this.extendedItem.node).getPathData({ normalize: true });
    for (let p of pathdata) {
      switch (p.type) {
        case 'M':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._lastPos = { x: p.values[0], y: p.values[1] };
          break;
        case 'L':
          this._drawPathCircle(p.values[0], p.values[1]);
          break;
        case 'H':
          break;
        case 'V':
          break;
        case 'Z':
          break;
        case 'C':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(p.values[4], p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          this._drawPathCircle(p.values[4], p.values[5]);
          this._lastPos = { x: p.values[4], y: p.values[5] };
          break;
        case 'c':
          this._drawPathLine(this._lastPos.x, this._lastPos.y, p.values[0], p.values[1]);
          this._drawPathLine(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5], p.values[2], p.values[3]);
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          this._drawPathCircle(this._lastPos.x + p.values[4], this._lastPos.y + p.values[5]);
          this._lastPos = { x: p.values[4], y: p.values[5] };
          break;
        case 'S':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          break;
        case 'Q':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[2], p.values[3]);
          break;
        case 'T':
          this._drawPathCircle(p.values[0], p.values[1]);
          break;
        case 'A':
          this._drawPathCircle(p.values[0], p.values[1]);
          this._drawPathCircle(p.values[5], p.values[6]);
          break;
      }
    }
  }

  pointerEvent(event: PointerEvent) {
    event.stopPropagation();

    this._rect = this.extendedItem.element.getBoundingClientRect();
    this._computed = getComputedStyle(this.extendedItem.element);
    this._to = this._computed.transformOrigin.split(' ');

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._startPos = { x: event.x, y: event.y };
        console.log("Pointer Down");
        break;

      case EventNames.PointerMove:
        console.log("Pointer Move");
        if (this._startPos && event.buttons > 0) {
          const dx = event.x - this._startPos.x;
          const dy = event.y - this._startPos.y;
          this._circle.setAttribute('cx', <any>(this._rect.x - this.designerCanvas.containerBoundingRect.x + Number.parseFloat(this._to[0].replace('px', '')) + dx));
          this._circle.setAttribute('cy', <any>(this._rect.y - this.designerCanvas.containerBoundingRect.y + Number.parseFloat(this._to[1].replace('px', '')) + dy));
          this._circle2.setAttribute('cx', <any>(this._rect.x - this.designerCanvas.containerBoundingRect.x + Number.parseFloat(this._to[0].replace('px', '')) + dx));
          this._circle2.setAttribute('cy', <any>(this._rect.y - this.designerCanvas.containerBoundingRect.y + Number.parseFloat(this._to[1].replace('px', '')) + dy));
        }
        break;

      case EventNames.PointerUp:
        console.log("Pointer Up");
        (<Element>event.target).releasePointerCapture(event.pointerId);
        if (this._startPos) {
          const dx = event.x - this._startPos.x;
          const dy = event.y - this._startPos.y;
          const x = Number.parseFloat(this._to[0].replace('px', ''));
          const y = Number.parseFloat(this._to[1].replace('px', ''));
          const newX = (dx + x);
          const newY = (dy + y);
          const przX = Math.round(newX / this._rect.width * 10000) / 100; //round to 2 decimal places
          const przY = Math.round(newY / this._rect.height * 10000) / 100;
          //this.extendedItem.setStyle('transform-origin',newX + 'px ' + newY + 'px');
          this.extendedItem.setStyle('transform-origin', przX + '% ' + przY + '%');
          this.refresh();
          this._startPos = null;
        }
        break;
    }
  }

  _drawPathCircle(x: number, y: number) {
    this._rect = this.extendedItem.element.getBoundingClientRect();
    this._computed = getComputedStyle(this.extendedItem.element);
    this._to = this._computed.transformOrigin.split(' ');

    this._circle = this._drawCircle(this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y, 3, 'svg-path');
    this._circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event));
    this._circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event));
    this._circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event));
    this._circle2 = this._drawCircle(this._rect.x - this.designerCanvas.containerBoundingRect.x + Number.parseFloat(this._to[0].replace('px', '')), this._rect.y - this.designerCanvas.containerBoundingRect.y + Number.parseFloat(this._to[1].replace('px', '')), 1, 'svg-transform-origin');
    this._circle2.setAttribute('style', 'pointer-events: none');
  }

  _drawPathLine(x1: number, y1: number, x2: number, y2: number) {
    this._drawLine(this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x1, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y1, this._parentRect.x - this.designerCanvas.containerBoundingRect.x + x2, this._parentRect.y - this.designerCanvas.containerBoundingRect.y + y2, 'svg-path-line');
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}