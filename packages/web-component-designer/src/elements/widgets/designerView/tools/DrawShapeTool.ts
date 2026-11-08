import type { ITool } from './ITool.js';
import type { IDesignerCanvas } from '../IDesignerCanvas.js';
import type { ServiceContainer } from '../../../services/ServiceContainer.js';
import type { IPoint } from '../../../../interfaces/IPoint.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { applySvgDrawingStyle, insertSvgDrawing } from './SvgDrawingHelper.js';

export interface SvgShapeDefinition { id: string; name: string; path: string; }
type ShapeSegment = { type: string, values: number[] };

export class DrawShapeTool implements ITool {
  readonly cursor = 'crosshair';
  private canvas: IDesignerCanvas;
  private preview: SVGPathElement;
  private start: IPoint;
  private bounds: { x: number, y: number, width: number, height: number };
  private original: { x: number, y: number, width: number, height: number };
  private segments: ShapeSegment[];
  private capture: Element;
  private pointerId: number;

  constructor(private shape: SvgShapeDefinition = { id: 'star', name: 'Star', path: 'M50 0 61 35 98 35 68 57 79 92 50 71 21 92 32 57 2 35 39 35Z' }) {}
  activated(container: ServiceContainer) {}
  dispose() {
    if (this.preview) this.canvas?.overlayLayer.removeOverlay(this.preview);
    if (this.capture) {
      try { this.capture.releasePointerCapture(this.pointerId); } catch { /* Capture can end before disposal. */ }
    }
    this.canvas?.releaseActiveTool();
    this.preview = undefined;
    this.capture = undefined;
    this.canvas = undefined;
  }

  pointerEventHandler(canvas: IDesignerCanvas, event: PointerEvent) {
    const point = canvas.getNormalizedEventCoordinates(event);
    if (event.type === 'pointerdown' && event.button === 0) {
      this.canvas = canvas;
      this.start = point;
      this.capture = event.target as Element;
      this.pointerId = event.pointerId;
      this.capture.setPointerCapture(event.pointerId);
      canvas.captureActiveTool(this);
      this.preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      this.preview.setAttribute('d', this.shape.path);
      applySvgDrawingStyle(this.preview, canvas.serviceContainer.globalContext);
      canvas.overlayLayer.addOverlay('DrawShapeTool', this.preview, OverlayLayer.Foreground);
      const box = this.preview.getBBox();
      this.original = { x: box.x, y: box.y, width: Math.max(box.width, 1), height: Math.max(box.height, 1) };
      this.segments = this.preview.getPathData({ normalize: true }) as unknown as ShapeSegment[];
      this.update(point, event.shiftKey);
    } else if (event.type === 'pointermove' && this.preview) this.update(point, event.shiftKey);
    else if (event.type === 'pointerup' && this.preview) {
      this.update(point, event.shiftKey);
      const bounds = this.bounds;
      if (bounds.width * canvas.zoomFactor < 3 || bounds.height * canvas.zoomFactor < 3) { this.cancel(); return; }
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', this.pathData(0, 0, bounds.width, bounds.height));
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.cssText = `position:absolute;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;overflow:visible`;
      applySvgDrawingStyle(svg, canvas.serviceContainer.globalContext);
      svg.append(path);
      this.dispose();
      insertSvgDrawing(canvas, svg, `Draw ${this.shape.name}`);
    } else if (event.type === 'pointercancel') this.cancel();
    event.preventDefault();
    event.stopPropagation();
  }

  keyboardEventHandler(canvas: IDesignerCanvas, event: KeyboardEvent) {
    if (event.type === 'keydown' && event.key === 'Escape') {
      this.cancel();
      event.preventDefault();
    }
  }

  private update(point: IPoint, constrain: boolean) {
    let width = Math.abs(point.x - this.start.x), height = Math.abs(point.y - this.start.y);
    if (constrain) {
      const scale = Math.max(width / this.original.width, height / this.original.height);
      width = this.original.width * scale;
      height = this.original.height * scale;
    }
    this.bounds = { x: point.x < this.start.x ? this.start.x - width : this.start.x,
      y: point.y < this.start.y ? this.start.y - height : this.start.y, width, height };
    this.preview.setAttribute('d', this.pathData(this.bounds.x, this.bounds.y, width, height));
  }

  private pathData(x: number, y: number, width: number, height: number): string {
    return this.segments.map(segment => segment.type + ' ' + segment.values.map((value, index) => index % 2
      ? y + (value - this.original.y) * height / this.original.height
      : x + (value - this.original.x) * width / this.original.width).join(' ')).join(' ');
  }

  private cancel() {
    const canvas = this.canvas;
    this.dispose();
    if (canvas) canvas.serviceContainer.globalContext.finishedWithTool(this);
  }
}
