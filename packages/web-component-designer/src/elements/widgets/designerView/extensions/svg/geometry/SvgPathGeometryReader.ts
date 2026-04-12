import { IPoint } from '../../../../../../interfaces/IPoint.js';
import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './IGeometry.js';
import "../../../../../helper/PathDataPolyfill.js";
import { PathData, createPathD } from '../../../../../helper/PathDataPolyfill.js';

export class SvgPathGeometryReader implements IGeometryReader {

  read(element: Element): IGeometry {
    const pathEl = element as SVGPathElement;
    const pathData: PathData[] = pathEl.getPathData({ normalize: false });
    const segments: IGeometrySegment[] = [];
    let lastPos: IPoint = { x: 0, y: 0 };
    let firstPos: IPoint = { x: 0, y: 0 };
    let closed = false;

    for (const cmd of pathData) {
      const rel = cmd.type === cmd.type.toLowerCase();
      const t = cmd.type.toUpperCase();

      switch (t) {
        case 'M': {
          const x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          segments.push({ type: SegmentType.Move, relative: rel, point: { x, y } });
          lastPos = { x, y };
          firstPos = { x, y };
          break;
        }
        case 'L': {
          const x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          segments.push({ type: SegmentType.Line, relative: rel, point: { x, y } });
          lastPos = { x, y };
          break;
        }
        case 'H': {
          const x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          segments.push({ type: SegmentType.HorizontalLine, relative: rel, point: { x, y: lastPos.y } });
          lastPos = { x, y: lastPos.y };
          break;
        }
        case 'V': {
          const y = rel ? lastPos.y + cmd.values[0] : cmd.values[0];
          segments.push({ type: SegmentType.VerticalLine, relative: rel, point: { x: lastPos.x, y } });
          lastPos = { x: lastPos.x, y };
          break;
        }
        case 'C': {
          const cp1x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const cp1y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          const cp2x = rel ? lastPos.x + cmd.values[2] : cmd.values[2];
          const cp2y = rel ? lastPos.y + cmd.values[3] : cmd.values[3];
          const x = rel ? lastPos.x + cmd.values[4] : cmd.values[4];
          const y = rel ? lastPos.y + cmd.values[5] : cmd.values[5];
          segments.push({
            type: SegmentType.CubicBezier, relative: rel,
            point: { x, y }, cp1: { x: cp1x, y: cp1y }, cp2: { x: cp2x, y: cp2y }
          });
          lastPos = { x, y };
          break;
        }
        case 'S': {
          const cp2x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const cp2y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          const x = rel ? lastPos.x + cmd.values[2] : cmd.values[2];
          const y = rel ? lastPos.y + cmd.values[3] : cmd.values[3];
          segments.push({
            type: SegmentType.SmoothCubic, relative: rel,
            point: { x, y }, cp2: { x: cp2x, y: cp2y }
          });
          lastPos = { x, y };
          break;
        }
        case 'Q': {
          const cp1x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const cp1y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          const x = rel ? lastPos.x + cmd.values[2] : cmd.values[2];
          const y = rel ? lastPos.y + cmd.values[3] : cmd.values[3];
          segments.push({
            type: SegmentType.QuadraticBezier, relative: rel,
            point: { x, y }, cp1: { x: cp1x, y: cp1y }
          });
          lastPos = { x, y };
          break;
        }
        case 'T': {
          const x = rel ? lastPos.x + cmd.values[0] : cmd.values[0];
          const y = rel ? lastPos.y + cmd.values[1] : cmd.values[1];
          segments.push({ type: SegmentType.SmoothQuadratic, relative: rel, point: { x, y } });
          lastPos = { x, y };
          break;
        }
        case 'A': {
          const x = rel ? lastPos.x + cmd.values[5] : cmd.values[5];
          const y = rel ? lastPos.y + cmd.values[6] : cmd.values[6];
          segments.push({
            type: SegmentType.Arc, relative: rel,
            point: { x, y },
            arc: {
              rx: cmd.values[0], ry: cmd.values[1],
              rotation: cmd.values[2],
              largeArc: cmd.values[3] === 1,
              sweep: cmd.values[4] === 1
            }
          });
          lastPos = { x, y };
          break;
        }
        case 'Z': {
          closed = true;
          segments.push({ type: SegmentType.Close, relative: rel, point: { ...firstPos } });
          lastPos = { ...firstPos };
          break;
        }
      }
    }

    return { segments, closed };
  }

  serialize(geometry: IGeometry): { attribute: string; value: string }[] {
    const pathData: PathData[] = [];
    let lastPos: IPoint = { x: 0, y: 0 };

    for (const seg of geometry.segments) {
      const rel = seg.relative;

      switch (seg.type) {
        case SegmentType.Move: {
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 'm' : 'M', values: [x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.Line: {
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 'l' : 'L', values: [x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.HorizontalLine: {
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          pathData.push({ type: rel ? 'h' : 'H', values: [x] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.VerticalLine: {
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 'v' : 'V', values: [y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.CubicBezier: {
          const cp1x = rel ? seg.cp1.x - lastPos.x : seg.cp1.x;
          const cp1y = rel ? seg.cp1.y - lastPos.y : seg.cp1.y;
          const cp2x = rel ? seg.cp2.x - lastPos.x : seg.cp2.x;
          const cp2y = rel ? seg.cp2.y - lastPos.y : seg.cp2.y;
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 'c' : 'C', values: [cp1x, cp1y, cp2x, cp2y, x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.SmoothCubic: {
          const cp2x = rel ? seg.cp2.x - lastPos.x : seg.cp2.x;
          const cp2y = rel ? seg.cp2.y - lastPos.y : seg.cp2.y;
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 's' : 'S', values: [cp2x, cp2y, x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.QuadraticBezier: {
          const cp1x = rel ? seg.cp1.x - lastPos.x : seg.cp1.x;
          const cp1y = rel ? seg.cp1.y - lastPos.y : seg.cp1.y;
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 'q' : 'Q', values: [cp1x, cp1y, x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.SmoothQuadratic: {
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({ type: rel ? 't' : 'T', values: [x, y] } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.Arc: {
          const x = rel ? seg.point.x - lastPos.x : seg.point.x;
          const y = rel ? seg.point.y - lastPos.y : seg.point.y;
          pathData.push({
            type: rel ? 'a' : 'A',
            values: [
              seg.arc.rx, seg.arc.ry, seg.arc.rotation,
              seg.arc.largeArc ? 1 : 0, seg.arc.sweep ? 1 : 0,
              x, y
            ]
          } as any);
          lastPos = { ...seg.point };
          break;
        }
        case SegmentType.Close: {
          pathData.push({ type: rel ? 'z' : 'Z', values: [] } as any);
          break;
        }
      }
    }

    return [{ attribute: 'd', value: createPathD(pathData) }];
  }
}
