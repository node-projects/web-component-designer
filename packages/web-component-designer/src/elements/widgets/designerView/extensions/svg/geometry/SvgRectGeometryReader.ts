import { IGeometry, IGeometryReader, IGeometrySegment, IGeometrySerializationHint, IGeometryWrite, SegmentType } from './IGeometry.js';

const rectGeometryProperties = ['x', 'y', 'width', 'height'] as const;
type RectGeometryProperty = typeof rectGeometryProperties[number];

function getRectSerializationHint(rect: SVGRectElement, property: RectGeometryProperty): IGeometrySerializationHint {
  const styleValue = rect.style.getPropertyValue(property).trim();
  if (styleValue) {
    return { target: 'style', unit: extractStyleUnit(styleValue) };
  }
  return { target: 'attribute' };
}

function extractStyleUnit(value: string): string {
  const match = value.trim().match(/^-?(?:\d+|\d*\.\d+)([a-z%]*)$/i);
  if (match && match[1]) {
    return match[1];
  }
  return 'px';
}

function serializeRectValue(property: RectGeometryProperty, value: number, hints?: IGeometry['serializationHints']): IGeometryWrite {
  const hint = hints?.[property];
  if (hint?.target === 'style') {
    return {
      attribute: property,
      value: `${value}${hint.unit ?? 'px'}`,
      target: 'style'
    };
  }

  return {
    attribute: property,
    value: value.toString()
  };
}

export class SvgRectGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const rect = element as SVGRectElement;
    const bbox = rect.getBBox();
    const x = bbox.x;
    const y = bbox.y;
    const w = bbox.width;
    const h = bbox.height;

    const segments: IGeometrySegment[] = [
      { type: SegmentType.Move, relative: false, point: { x, y } },
      { type: SegmentType.Line, relative: false, point: { x: x + w, y } },
      { type: SegmentType.Line, relative: false, point: { x: x + w, y: y + h } },
      { type: SegmentType.Line, relative: false, point: { x, y: y + h } },
      { type: SegmentType.Close, relative: false, point: { x, y } },
    ];

    const serializationHints = Object.fromEntries(
      rectGeometryProperties.map(property => [property, getRectSerializationHint(rect, property)])
    );

    return { segments, closed: true, serializationHints };
  }

  serialize(geometry: IGeometry): IGeometryWrite[] {
    const pts = geometry.segments.filter(s => s.type !== SegmentType.Close);
    if (pts.length < 2) return [];

    const xs = pts.map(p => p.point.x);
    const ys = pts.map(p => p.point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return [
      serializeRectValue('x', minX, geometry.serializationHints),
      serializeRectValue('y', minY, geometry.serializationHints),
      serializeRectValue('width', maxX - minX, geometry.serializationHints),
      serializeRectValue('height', maxY - minY, geometry.serializationHints),
    ];
  }
}
