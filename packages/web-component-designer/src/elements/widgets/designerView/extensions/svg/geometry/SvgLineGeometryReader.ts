import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';

export class SvgLineGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const line = element as SVGLineElement;
    const x1 = line.x1.baseVal.value;
    const y1 = line.y1.baseVal.value;
    const x2 = line.x2.baseVal.value;
    const y2 = line.y2.baseVal.value;

    const segments: IGeometrySegment[] = [
      { type: SegmentType.Move, relative: false, point: { x: x1, y: y1 } },
      { type: SegmentType.Line, relative: false, point: { x: x2, y: y2 } },
    ];

    return { segments, closed: false };
  }

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (pts.length < 2) return [];
    return [
      { attribute: 'x1', value: pts[0].point.x.toString() },
      { attribute: 'y1', value: pts[0].point.y.toString() },
      { attribute: 'x2', value: pts[1].point.x.toString() },
      { attribute: 'y2', value: pts[1].point.y.toString() },
    ];
  }
}
