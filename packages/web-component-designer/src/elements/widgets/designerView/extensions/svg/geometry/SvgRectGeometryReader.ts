import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

export class SvgRectGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const rect = element as SVGRectElement;
    const x = rect.x.baseVal.value;
    const y = rect.y.baseVal.value;
    const w = rect.width.baseVal.value;
    const h = rect.height.baseVal.value;

    const segments: IGeometrySegment[] = [
      { type: SegmentType.Move, relative: false, point: { x, y } },
      { type: SegmentType.Line, relative: false, point: { x: x + w, y } },
      { type: SegmentType.Line, relative: false, point: { x: x + w, y: y + h } },
      { type: SegmentType.Line, relative: false, point: { x, y: y + h } },
      { type: SegmentType.Close, relative: false, point: { x, y } },
    ];

    return { segments, closed: true };
  }

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (pts.length < 2) return [];

    const xs = pts.map(p => p.point.x);
    const ys = pts.map(p => p.point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return [
      { attribute: 'x', value: minX.toString() },
      { attribute: 'y', value: minY.toString() },
      { attribute: 'width', value: (maxX - minX).toString() },
      { attribute: 'height', value: (maxY - minY).toString() },
    ];
  }
}
