import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

export class SvgCircleGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const el = element as SVGCircleElement;
    const cx = el.cx.baseVal.value;
    const cy = el.cy.baseVal.value;
    const r = el.r.baseVal.value;

    // Same as ellipse but rx == ry == r
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

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (pts.length < 4) return [];

    const top = pts[0].point;
    const right = pts[1].point;
    const bottom = pts[2].point;
    const left = pts[3].point;

    const cx = (right.x + left.x) / 2;
    const cy = (top.y + bottom.y) / 2;
    const r = Math.max(Math.abs(right.x - left.x) / 2, Math.abs(bottom.y - top.y) / 2);

    return [
      { attribute: 'cx', value: cx.toString() },
      { attribute: 'cy', value: cy.toString() },
      { attribute: 'r', value: r.toString() },
    ];
  }
}
