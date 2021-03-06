import { EventNames } from "../../../../enums/EventNames";
import { IPoint } from "../../../../interfaces/IPoint";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class TransformOriginExtension extends AbstractExtension {
  private _startPos: IPoint;
  private _circle: SVGCircleElement;
  private _circle2: SVGCircleElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    const rect = this.extendedItem.element.getBoundingClientRect();
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' ');
    this._circle = this._drawCircleOverlay(rect.x - this.designerView.containerBoundingRect.x + Number.parseFloat(to[0].replace('px', '')), rect.y - this.designerView.containerBoundingRect.y + Number.parseFloat(to[1].replace('px', '')), 5, 'svg-transform-origin');
    this._circle.setAttribute('style', 'cursor: pointer');
    this._circle2 = this._drawCircleOverlay(rect.x - this.designerView.containerBoundingRect.x + Number.parseFloat(to[0].replace('px', '')), rect.y - this.designerView.containerBoundingRect.y + Number.parseFloat(to[1].replace('px', '')), 1, 'svg-transform-origin');
    this._circle2.setAttribute('style', 'pointer-events: none');
    this._circle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event));
    this._circle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event));
    this._circle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event)); //TODO: -> assign to window
  }

  pointerEvent(event: PointerEvent) {
    event.stopPropagation();

    const rect = this.extendedItem.element.getBoundingClientRect();
    const computed = getComputedStyle(this.extendedItem.element);
    const to = computed.transformOrigin.split(' ');

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._startPos = { x: event.x, y: event.y };
        break;
      case EventNames.PointerMove:
        if (this._startPos && event.buttons > 0) {
          const dx = event.x - this._startPos.x;
          const dy = event.y - this._startPos.y;
          this._circle.setAttribute('cx', <any>(rect.x - this.designerView.containerBoundingRect.x + Number.parseFloat(to[0].replace('px', '')) + dx));
          this._circle.setAttribute('cy', <any>(rect.y - this.designerView.containerBoundingRect.y + Number.parseFloat(to[1].replace('px', '')) + dy));
          this._circle2.setAttribute('cx', <any>(rect.x - this.designerView.containerBoundingRect.x + Number.parseFloat(to[0].replace('px', '')) + dx));
          this._circle2.setAttribute('cy', <any>(rect.y - this.designerView.containerBoundingRect.y + Number.parseFloat(to[1].replace('px', '')) + dy));
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        if (this._startPos) {
          const dx = event.x - this._startPos.x;
          const dy = event.y - this._startPos.y;
          const x = Number.parseFloat(to[0].replace('px', ''));
          const y = Number.parseFloat(to[1].replace('px', ''));
          const newX = (dx + x);
          const newY = (dy + y);
          const przX = Math.round(newX / rect.width * 10000) / 100; //round to 2 decimal places
          const przY = Math.round(newY / rect.height * 10000) / 100;
          //this.extendedItem.setStyle('transformOrigin',newX + 'px ' + newY + 'px');
          this.extendedItem.setStyle('transformOrigin', przX + '% ' + przY + '%');
          this.refresh();
          this._startPos = null;
        }
        break;
    }
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}