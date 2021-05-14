import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";

export abstract class AbstractExtension implements IDesignerExtension {
  protected overlays: SVGGraphicsElement[] = [];
  protected overlayLayer: SVGElement;
  protected designerView: IDesignerView;
  protected extendedItem: IDesignItem;

  constructor(designerView: IDesignerView, extendedItem: IDesignItem) {
    this.designerView = designerView;
    this.extendedItem = extendedItem;

    this.overlayLayer = designerView.overlayLayer;
  }

  abstract extend();
  abstract refresh();
  abstract dispose();

  protected _removeAllOverlays() {
    for (let o of this.overlays) {
      this.overlayLayer.removeChild(o);
    }
    this.overlays = [];
  }

  _drawLineOverlay(x1: number, y1: number, x2: number, y2: number, className: string) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', <string><any>x1);
    line.setAttribute('y1', <string><any>y1);
    line.setAttribute('x2', <string><any>x2);
    line.setAttribute('y2', <string><any>y2);
    if (className)
      line.setAttribute('class', className);
    this.overlayLayer.appendChild(line);
    this.overlays.push(line);
    return line;
  }

  _drawCircleOverlay(x: number, y: number, radius: number, className: string) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', <string><any>x);
    circle.setAttribute('cy', <string><any>y);
    circle.setAttribute('r', <string><any>radius);
    if (className)
      circle.setAttribute('class', className);
    this.overlayLayer.appendChild(circle);
    this.overlays.push(circle);
    return circle;
  }

  _drawRect(x: number, y: number, w: number, h: number, className: string) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('x', <string><any>x);
    rect.setAttribute('y', <string><any>y);
    rect.setAttribute('width', <string><any>w);
    rect.setAttribute('height', <string><any>h);
    if (className)
      rect.setAttribute('class', className);
    this.overlayLayer.appendChild(rect);
    this.overlays.push(rect);
    return rect;
  }

  _drawText(text: string, x: number, y: number, className: string) {
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute('x', <string><any>x);
    textEl.setAttribute('y', <string><any>y);
    textEl.textContent = text;
    if (className)
      textEl.setAttribute('class', className);
    this.overlayLayer.appendChild(textEl);
    this.overlays.push(textEl);
    return textEl;
  }
}