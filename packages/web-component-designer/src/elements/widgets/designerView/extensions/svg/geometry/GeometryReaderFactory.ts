import { IGeometryReader } from './IGeometry.js';
import { SvgPathGeometryReader } from './SvgPathGeometryReader.js';
import { SvgRectGeometryReader } from './SvgRectGeometryReader.js';
import { SvgLineGeometryReader } from './SvgLineGeometryReader.js';
import { SvgEllipseGeometryReader } from './SvgEllipseGeometryReader.js';
import { SvgCircleGeometryReader } from './SvgCircleGeometryReader.js';
import { SvgPolygonGeometryReader } from './SvgPolygonGeometryReader.js';
import { SvgPolylineGeometryReader } from './SvgPolylineGeometryReader.js';

const readerMap = new Map<Function, IGeometryReader>();

export function getGeometryReader(element: Element): IGeometryReader | undefined {
  if (element instanceof SVGPathElement) {
    if (!readerMap.has(SVGPathElement)) readerMap.set(SVGPathElement, new SvgPathGeometryReader());
    return readerMap.get(SVGPathElement);
  }
  if (element instanceof SVGRectElement) {
    if (!readerMap.has(SVGRectElement)) readerMap.set(SVGRectElement, new SvgRectGeometryReader());
    return readerMap.get(SVGRectElement);
  }
  if (element instanceof SVGLineElement) {
    if (!readerMap.has(SVGLineElement)) readerMap.set(SVGLineElement, new SvgLineGeometryReader());
    return readerMap.get(SVGLineElement);
  }
  if (element instanceof SVGEllipseElement) {
    if (!readerMap.has(SVGEllipseElement)) readerMap.set(SVGEllipseElement, new SvgEllipseGeometryReader());
    return readerMap.get(SVGEllipseElement);
  }
  if (element instanceof SVGCircleElement) {
    if (!readerMap.has(SVGCircleElement)) readerMap.set(SVGCircleElement, new SvgCircleGeometryReader());
    return readerMap.get(SVGCircleElement);
  }
  if (element instanceof SVGPolygonElement) {
    if (!readerMap.has(SVGPolygonElement)) readerMap.set(SVGPolygonElement, new SvgPolygonGeometryReader());
    return readerMap.get(SVGPolygonElement);
  }
  if (element instanceof SVGPolylineElement) {
    if (!readerMap.has(SVGPolylineElement)) readerMap.set(SVGPolylineElement, new SvgPolylineGeometryReader());
    return readerMap.get(SVGPolylineElement);
  }
  return undefined;
}

const customReaders = new Map<string, IGeometryReader>();

export function registerGeometryReader(key: string, reader: IGeometryReader) {
  customReaders.set(key, reader);
}

export function getCustomGeometryReader(key: string): IGeometryReader | null {
  return customReaders.get(key) ?? null;
}
