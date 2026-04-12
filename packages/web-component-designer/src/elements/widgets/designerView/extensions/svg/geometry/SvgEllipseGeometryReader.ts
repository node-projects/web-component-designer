import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

export class SvgEllipseGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const el = element as SVGEllipseElement;
    const cx = el.cx.baseVal.value;
    const cy = el.cy.baseVal.value;
    const rx = el.rx.baseVal.value;
    const ry = el.ry.baseVal.value;

    // Represent ellipse as 4 cardinal points (top, right, bottom, left)
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

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    // Reconstruct cx, cy, rx, ry from the cardinal points
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (pts.length < 4) return [];

    // top=0, right=1, bottom=2, left=3
    const top = pts[0].point;
    const right = pts[1].point;
    const bottom = pts[2].point;
    const left = pts[3].point;

    const cx = (right.x + left.x) / 2;
    const cy = (top.y + bottom.y) / 2;
    const rx = Math.abs(right.x - left.x) / 2;
    const ry = Math.abs(bottom.y - top.y) / 2;

    return [
      { attribute: 'cx', value: cx.toString() },
      { attribute: 'cy', value: cy.toString() },
      { attribute: 'rx', value: rx.toString() },
      { attribute: 'ry', value: ry.toString() },
    ];
  }
}
