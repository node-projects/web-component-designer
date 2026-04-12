import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

/**
 * Reads and writes CSS `clip-path` property geometry.
 * Supports: polygon(), circle(), ellipse(), path()
 */
export class CssClipPathGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const style = getComputedStyle(element);
    const raw = style.clipPath || element.getAttribute('style')?.match(/clip-path\s*:\s*([^;]+)/)?.[1] || '';
    return this._parse(raw);
  }

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const value = this._serializeGeometry(geometry);
    return [{ attribute: 'style:clipPath', value }];
  }

  private _parse(raw: string): IGeometry {
    const trimmed = raw.trim();

    if (trimmed.startsWith('polygon(')) {
      return this._parsePolygon(trimmed);
    }
    if (trimmed.startsWith('circle(')) {
      return this._parseCircle(trimmed);
    }
    if (trimmed.startsWith('ellipse(')) {
      return this._parseEllipse(trimmed);
    }
    if (trimmed.startsWith('path(')) {
      return this._parsePath(trimmed);
    }

    return { segments: [], closed: false };
  }

  private _parsePolygon(raw: string): IGeometry {
    // polygon(x1 y1, x2 y2, ...)
    const inner = raw.slice(8, -1).trim();
    const segments: IGeometrySegment[] = [];
    const pairs = inner.split(',');
    for (let i = 0; i < pairs.length; i++) {
      const parts = pairs[i].trim().split(/\s+/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          segments.push({
            type: i === 0 ? SegmentType.Move : SegmentType.Line,
            relative: false,
            point: { x, y },
          });
        }
      }
    }
    if (segments.length > 0) {
      segments.push({ type: SegmentType.Close, relative: false, point: { ...segments[0].point } });
    }
    return { segments, closed: true };
  }

  private _parseCircle(raw: string): IGeometry {
    // circle(r at cx cy)
    const inner = raw.slice(7, -1).trim();
    const atIdx = inner.indexOf(' at ');
    let r = 50, cx = 50, cy = 50;
    if (atIdx >= 0) {
      r = parseFloat(inner.substring(0, atIdx));
      const pos = inner.substring(atIdx + 4).trim().split(/\s+/);
      cx = parseFloat(pos[0]) || 50;
      cy = parseFloat(pos[1]) || 50;
    } else {
      r = parseFloat(inner) || 50;
    }
    const segments: IGeometrySegment[] = [
      { type: SegmentType.Move, relative: false, point: { x: cx, y: cy - r } },
      { type: SegmentType.Arc, relative: false, point: { x: cx + r, y: cy }, arc: { rx: r, ry: r, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx, y: cy + r }, arc: { rx: r, ry: r, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx - r, y: cy }, arc: { rx: r, ry: r, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx, y: cy - r }, arc: { rx: r, ry: r, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Close, relative: false, point: { x: cx, y: cy - r } },
    ];
    return { segments, closed: true };
  }

  private _parseEllipse(raw: string): IGeometry {
    // ellipse(rx ry at cx cy)
    const inner = raw.slice(8, -1).trim();
    const atIdx = inner.indexOf(' at ');
    let rx = 50, ry = 25, cx = 50, cy = 50;
    if (atIdx >= 0) {
      const radii = inner.substring(0, atIdx).trim().split(/\s+/);
      rx = parseFloat(radii[0]) || 50;
      ry = parseFloat(radii[1]) || 25;
      const pos = inner.substring(atIdx + 4).trim().split(/\s+/);
      cx = parseFloat(pos[0]) || 50;
      cy = parseFloat(pos[1]) || 50;
    }
    const segments: IGeometrySegment[] = [
      { type: SegmentType.Move, relative: false, point: { x: cx, y: cy - ry } },
      { type: SegmentType.Arc, relative: false, point: { x: cx + rx, y: cy }, arc: { rx, ry, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx, y: cy + ry }, arc: { rx, ry, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx - rx, y: cy }, arc: { rx, ry, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Arc, relative: false, point: { x: cx, y: cy - ry }, arc: { rx, ry, rotation: 0, largeArc: false, sweep: true } },
      { type: SegmentType.Close, relative: false, point: { x: cx, y: cy - ry } },
    ];
    return { segments, closed: true };
  }

  private _parsePath(raw: string): IGeometry {
    // path("d string") — delegate to an internal SVG path parser
    // Extract d string between quotes
    const match = raw.match(/path\(\s*["']([^"']+)["']\s*\)/);
    if (!match) return { segments: [], closed: false };
    // Create a temporary SVG path element to parse
    const tempNs = 'http://www.w3.org/2000/svg';
    const tempSvg = document.createElementNS(tempNs, 'svg');
    const tempPath = document.createElementNS(tempNs, 'path');
    tempPath.setAttribute('d', match[1]);
    tempSvg.appendChild(tempPath);
    // Temporarily attach for getPathData to work
    tempSvg.style.position = 'absolute';
    tempSvg.style.width = '0';
    tempSvg.style.height = '0';
    tempSvg.style.overflow = 'hidden';
    document.body.appendChild(tempSvg);
    try {
      const { SvgPathGeometryReader } = require('./SvgPathGeometryReader.js');
      const reader = new SvgPathGeometryReader();
      return reader.read(tempPath);
    } catch {
      return { segments: [], closed: false };
    } finally {
      document.body.removeChild(tempSvg);
    }
  }

  private _serializeGeometry(geometry: IGeometry): string {
    // Detect the shape type from the segment structure
    const nonClose = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (nonClose.length === 0) return 'none';

    // If all non-move/close segments are arcs with equal rx/ry => circle or ellipse
    const arcs = nonClose.filter(s => s.type === SegmentType.Arc);
    if (arcs.length >= 3 && arcs[0].arc) {
      // Compute center from cardinal points
      const pts = nonClose;
      const top = pts[0].point;
      const right = pts[1].point;
      const bottom = pts[2].point;
      const left = pts[3].point;
      const cx = (right.x + left.x) / 2;
      const cy = (top.y + bottom.y) / 2;
      const finalRx = Math.abs(right.x - left.x) / 2;
      const finalRy = Math.abs(bottom.y - top.y) / 2;

      if (Math.abs(finalRx - finalRy) < 0.01) {
        return `circle(${finalRx}px at ${cx}px ${cy}px)`;
      }
      return `ellipse(${finalRx}px ${finalRy}px at ${cx}px ${cy}px)`;
    }

    // Otherwise serialize as polygon
    const points = nonClose.map(s => `${s.point.x}px ${s.point.y}px`).join(', ');
    return `polygon(${points})`;
  }
}
