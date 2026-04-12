import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

export class SvgPolygonGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const poly = element as SVGPolygonElement;
    const points = poly.points;
    const segments: IGeometrySegment[] = [];

    for (let i = 0; i < points.numberOfItems; i++) {
      const pt = points.getItem(i);
      if (i === 0) {
        segments.push({ type: SegmentType.Move, relative: false, point: { x: pt.x, y: pt.y } });
      } else {
        segments.push({ type: SegmentType.Line, relative: false, point: { x: pt.x, y: pt.y } });
      }
    }

    if (segments.length > 0) {
      segments.push({ type: SegmentType.Close, relative: false, point: { ...segments[0].point } });
    }

    return { segments, closed: true };
  }

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    const pointsStr = pts.map(s => `${s.point.x},${s.point.y}`).join(' ');
    return [{ attribute: 'points', value: pointsStr }];
  }
}
