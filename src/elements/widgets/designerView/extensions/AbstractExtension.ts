import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayerView } from '../overlayLayerView';
import { OverlayLayer } from './OverlayLayer';

export abstract class AbstractExtension implements IDesignerExtension {
  protected overlays: SVGGraphicsElement[] = [];
  protected overlayLayerView: OverlayLayerView;
  protected extensionManager: IExtensionManager;
  protected designerView: IDesignerView;
  protected extendedItem: IDesignItem;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem) {
    this.extensionManager = extensionManager;
    this.designerView = designerView;
    this.extendedItem = extendedItem;

    this.overlayLayerView = designerView.overlayLayer;
  }

  abstract extend();
  abstract refresh();
  abstract dispose();

  protected _removeAllOverlays() {
    for (let o of this.overlays) {
      try {
        this.overlayLayerView.removeOverlay(o);
      }
      catch (err) {
        console.error(err);
      }
    }
    this.overlays = [];
  }

  _drawLineOverlay(x1: number, y1: number, x2: number, y2: number, className?: string, line?: SVGLineElement, overlayLayer?: OverlayLayer) {
    if (!line) {
      line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      this.overlayLayerView.addOverlay(line, overlayLayer);
      this.overlays.push(line);
    }
    line.setAttribute('x1', <string><any>x1);
    line.setAttribute('y1', <string><any>y1);
    line.setAttribute('x2', <string><any>x2);
    line.setAttribute('y2', <string><any>y2);
    if (className)
      line.setAttribute('class', className);

    return line;
  }

  _drawCircleOverlay(x: number, y: number, radius: number, className?: string, circle?: SVGCircleElement, overlayLayer?: OverlayLayer) {
    if (!circle) {
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      this.overlayLayerView.addOverlay(circle, overlayLayer);
      this.overlays.push(circle);
    }
    circle.setAttribute('cx', <string><any>x);
    circle.setAttribute('cy', <string><any>y);
    circle.setAttribute('r', <string><any>radius);
    if (className)
      circle.setAttribute('class', className);
    return circle;
  }

  _drawRect(x: number, y: number, w: number, h: number, className?: string, rect?: SVGRectElement, overlayLayer?: OverlayLayer) {
    if (!rect) {
      rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.overlayLayerView.addOverlay(rect, overlayLayer);
      this.overlays.push(rect);
    }
    rect.setAttribute('x', <string><any>x);
    rect.setAttribute('y', <string><any>y);
    rect.setAttribute('width', <string><any>w);
    rect.setAttribute('height', <string><any>h);
    if (className)
      rect.setAttribute('class', className);
    return rect;
  }

  _drawText(text: string, x: number, y: number, className?: string, textEl?: SVGTextElement, overlayLayer?: OverlayLayer) {
    if (!textEl) {
      textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      this.overlayLayerView.addOverlay(textEl, overlayLayer);
      this.overlays.push(textEl);
    }
    textEl.setAttribute('x', <string><any>x);
    textEl.setAttribute('y', <string><any>y);
    textEl.textContent = text;
    if (className)
      textEl.setAttribute('class', className);
    return textEl;
  }
}