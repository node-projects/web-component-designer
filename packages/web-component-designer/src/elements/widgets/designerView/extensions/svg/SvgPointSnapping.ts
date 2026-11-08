import type { IPoint } from '../../../../../interfaces/IPoint.js';
import type { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { isVisualSvgElement, toOverlayPointFromSvgUserSpace } from '../../../../helper/SvgHelper.js';
import { getGeometryReader } from './geometry/GeometryReaderFactory.js';
import { SegmentType } from './geometry/IGeometry.js';
import { OverlayLayer } from '../OverlayLayer.js';

/** SVG node guides use canvas coordinates and a screen-pixel snap tolerance. */
export class SvgPointSnapping {
  private points: IPoint[] = [];
  private guides: SVGLineElement[] = [];

  constructor(private canvas: IDesignerCanvas, ignored?: Element) {
    const viewport = canvas.outerRect;
    for (const element of canvas.rootDesignItem.querySelectorAll('svg path,svg rect,svg circle,svg ellipse,svg line,svg polygon,svg polyline') as unknown as SVGGraphicsElement[]) {
      if (element === ignored || !isVisualSvgElement(element)) continue;
      const box = element.getBoundingClientRect();
      if (box.right < viewport.left || box.left > viewport.right || box.bottom < viewport.top || box.top > viewport.bottom) continue;
      const geometry = getGeometryReader(element)?.read(element);
      if (!geometry) continue;
      const anchors = geometry.segments.filter(segment => segment.type !== SegmentType.Close)
        .map(segment => toOverlayPointFromSvgUserSpace(element, canvas, segment.point));
      this.points.push(...anchors);
      for (let i = 1; i < anchors.length; i++) {
        if ([SegmentType.Line, SegmentType.HorizontalLine, SegmentType.VerticalLine].includes(geometry.segments[i].type))
          this.points.push({ x: (anchors[i - 1].x + anchors[i].x) / 2, y: (anchors[i - 1].y + anchors[i].y) / 2 });
      }
      if (anchors.length) {
        this.points.push({ x: (Math.min(...anchors.map(p => p.x)) + Math.max(...anchors.map(p => p.x))) / 2,
          y: (Math.min(...anchors.map(p => p.y)) + Math.max(...anchors.map(p => p.y))) / 2 });
      }
    }
  }

  snap(point: IPoint, additional: IPoint[] = [], bypass = false, axes = { x: true, y: true }): IPoint {
    this.clear();
    if (bypass) return point;
    const result = { ...point };
    const tolerance = 6 / this.canvas.zoomFactor;
    for (const axis of ['x', 'y'] as const) {
      if (!axes[axis]) continue;
      let closest: IPoint;
      let distance = tolerance;
      if (this.canvas.alignOnSnap) {
        for (const candidate of [...this.points, ...additional]) {
          const diff = Math.abs(point[axis] - candidate[axis]);
          if (diff <= distance) { closest = candidate; distance = diff; }
        }
      }
      if (closest) {
        result[axis] = closest[axis];
        this.drawGuide(axis, closest, result);
      } else if (this.canvas.alignOnGrid) {
        result[axis] = Math.round(point[axis] / this.canvas.gridSize) * this.canvas.gridSize;
      }
    }
    return result;
  }

  private drawGuide(axis: 'x' | 'y', reference: IPoint, point: IPoint) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const margin = 20 / this.canvas.zoomFactor;
    line.setAttribute('x1', String(axis === 'x' ? reference.x : Math.min(reference.x, point.x) - margin));
    line.setAttribute('x2', String(axis === 'x' ? reference.x : Math.max(reference.x, point.x) + margin));
    line.setAttribute('y1', String(axis === 'y' ? reference.y : Math.min(reference.y, point.y) - margin));
    line.setAttribute('y2', String(axis === 'y' ? reference.y : Math.max(reference.y, point.y) + margin));
    line.classList.add('svg-point-guide');
    line.style.cssText = `stroke:var(--wcd-color-selection,#3899ec);stroke-width:${1 / this.canvas.zoomFactor};stroke-dasharray:${4 / this.canvas.zoomFactor};pointer-events:none`;
    this.canvas.overlayLayer.addOverlay('SvgPointSnapping', line, OverlayLayer.Foreground);
    this.guides.push(line);
  }

  clear() {
    for (const guide of this.guides) this.canvas.overlayLayer.removeOverlay(guide);
    this.guides = [];
  }
}
