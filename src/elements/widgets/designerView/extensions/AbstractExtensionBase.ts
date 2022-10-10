import { IDesignerCanvas } from "../IDesignerCanvas";
import { IExtensionManager } from "./IExtensionManger";
import { OverlayLayerView } from '../overlayLayerView';
import { OverlayLayer } from './OverlayLayer';

export abstract class AbstractExtensionBase {
  protected overlays: SVGElement[] = [];
  protected overlayLayerView: OverlayLayerView;
  protected extensionManager: IExtensionManager;
  protected designerCanvas: IDesignerCanvas;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas) {
    this.extensionManager = extensionManager;
    this.designerCanvas = designerCanvas;

    this.overlayLayerView = designerCanvas.overlayLayer;
  }

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

  protected _drawLine(x1: number, y1: number, x2: number, y2: number, className?: string, line?: SVGLineElement, overlayLayer?: OverlayLayer) {
    const newLine = this.overlayLayerView.drawLine(x1, y1, x2, y2, className, line, overlayLayer);
    if (!line) {
      this.overlays.push(newLine);
    }
    return newLine;
  }

  protected _drawCircle(x: number, y: number, radius: number, className?: string, circle?: SVGCircleElement, overlayLayer?: OverlayLayer) {
    const newCircle = this.overlayLayerView.drawCircle(x, y, radius, className, circle, overlayLayer);
    if (!circle) {
      this.overlays.push(newCircle);
    }
    return newCircle;
  }

  protected _drawRect(x: number, y: number, w: number, h: number, className?: string, rect?: SVGRectElement, overlayLayer?: OverlayLayer) {
    const newRect = this.overlayLayerView.drawRect(x, y, w, h, className, rect, overlayLayer);
    if (!rect) {
      this.overlays.push(newRect);
    }
    return newRect;
  }

  protected _drawText(text: string, x: number, y: number, className?: string, textEl?: SVGTextElement, overlayLayer?: OverlayLayer) {
    const newText = this.overlayLayerView.drawText(text, x, y, className, textEl, overlayLayer);
    if (!textEl) {
      this.overlays.push(newText);
    }
    return newText;
  }

  protected _drawTextWithBackground(text: string, x: number, y: number, backgroundColor: string, className?: string, existingEls?: [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement], overlayLayer?: OverlayLayer) {
    const newEls = this.overlayLayerView.drawTextWithBackground(text, x, y, backgroundColor, className, existingEls, overlayLayer);
    if (!existingEls) {
      this.overlays.push(...newEls);
    }
    return newEls;
  }
}