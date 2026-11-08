import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IGeometrySegment, SegmentType } from './geometry/IGeometry.js';
import { SvgPathGeometryReader } from './geometry/SvgPathGeometryReader.js';

const mix = (a: IPoint, b: IPoint, t: number): IPoint => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const reflect = (p: IPoint, center: IPoint): IPoint => ({ x: 2 * center.x - p.x, y: 2 * center.y - p.y });
const distance = (a: IPoint, b: IPoint) => Math.hypot(a.x - b.x, a.y - b.y);

// Resolve shorthand controls before splitting: a following S/T must retain its
// original reflected control when its preceding segment has been split.
function explicitSegments(path: SVGPathElement): IGeometrySegment[] {
  const segments = new SvgPathGeometryReader().read(path).segments;
  for (let i = 1; i < segments.length; i++) {
    const s = segments[i], previous = segments[i - 1];
    if (s.type === SegmentType.SmoothCubic) {
      s.cp1 = previous.type === SegmentType.CubicBezier ? reflect(previous.cp2!, previous.point) : { ...previous.point };
      s.type = SegmentType.CubicBezier;
    } else if (s.type === SegmentType.SmoothQuadratic) {
      s.cp1 = previous.type === SegmentType.QuadraticBezier ? reflect(previous.cp1!, previous.point) : { ...previous.point };
      s.type = SegmentType.QuadraticBezier;
    }
  }
  return segments;
}

// SVG endpoint-to-center conversion, including the specified radii correction:
// https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
function arcGeometry(start: IPoint, segment: IGeometrySegment) {
  const arc = segment.arc!;
  let rx = Math.abs(arc.rx), ry = Math.abs(arc.ry);
  if (!rx || !ry || distance(start, segment.point) === 0) return undefined;
  const phi = arc.rotation * Math.PI / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (start.x - segment.point.x) / 2, dy = (start.y - segment.point.y) / 2;
  const x = cos * dx + sin * dy, y = -sin * dx + cos * dy;
  const scale = Math.sqrt(x * x / (rx * rx) + y * y / (ry * ry));
  if (scale > 1) { rx *= scale; ry *= scale; }
  const factor = (arc.largeArc === arc.sweep ? -1 : 1) * Math.sqrt(Math.max(0,
    (rx * rx * ry * ry - rx * rx * y * y - ry * ry * x * x) / (rx * rx * y * y + ry * ry * x * x)));
  const cx = factor * rx * y / ry, cy = -factor * ry * x / rx;
  const center = { x: cos * cx - sin * cy + (start.x + segment.point.x) / 2,
    y: sin * cx + cos * cy + (start.y + segment.point.y) / 2 };
  const angle = Math.atan2((y - cy) / ry, (x - cx) / rx);
  let sweep = Math.atan2((-y - cy) / ry, (-x - cx) / rx) - angle;
  if (arc.sweep && sweep < 0) sweep += 2 * Math.PI;
  if (!arc.sweep && sweep > 0) sweep -= 2 * Math.PI;
  return { rx, ry, sweep, point: (t: number): IPoint => {
    const a = angle + sweep * t;
    return { x: center.x + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin,
      y: center.y + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos };
  } };
}

function evaluator(start: IPoint, segment: IGeometrySegment): (t: number) => IPoint {
  if (segment.type === SegmentType.Arc) {
    const arc = arcGeometry(start, segment);
    if (arc) return arc.point;
  }
  if (segment.type === SegmentType.CubicBezier) return t => {
    const a = mix(start, segment.cp1!, t), b = mix(segment.cp1!, segment.cp2!, t), c = mix(segment.cp2!, segment.point, t);
    return mix(mix(a, b, t), mix(b, c, t), t);
  };
  if (segment.type === SegmentType.QuadraticBezier) return t => mix(mix(start, segment.cp1!, t), mix(segment.cp1!, segment.point, t), t);
  return t => mix(start, segment.point, t);
}

export interface SvgPathPointInsertion {
  index: number;
  t: number;
  /** Reject a menu action if the path changed while the menu was open. */
  originalD: string;
}

/** Find the nearest segment in screen space, independent of zoom and SVG transforms. */
export function findSvgPathPointInsertion(path: SVGPathElement, screenPoint: IPoint): SvgPathPointInsertion | undefined {
  const matrix = path.getScreenCTM();
  if (!matrix) return undefined;
  const toScreen = (p: IPoint) => new DOMPoint(p.x, p.y).matrixTransform(matrix);
  const segments = explicitSegments(path);
  if (segments.some(s => s.type !== SegmentType.Close && distance(toScreen(s.point), screenPoint) <= 6)) return undefined;
  const localPoint = new DOMPoint(screenPoint.x, screenPoint.y).matrixTransform(matrix.inverse());
  let best: SvgPathPointInsertion | undefined, bestDistance = path.isPointInStroke(localPoint) ? Infinity : 8;
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.type === SegmentType.Move) continue;
    const evaluate = evaluator(segments[i - 1].point, segment);
    const error = (t: number) => distance(toScreen(evaluate(t)), screenPoint);
    // Locate local minima before refining, including looping Beziers.
    const samples = 64;
    const errors = Array.from({ length: samples + 1 }, (_, n) => error(n / samples));
    for (let n = 0; n <= samples; n++) {
      if ((n > 0 && errors[n] > errors[n - 1]) || (n < samples && errors[n] > errors[n + 1])) continue;
      let left = Math.max(0, (n - 1) / samples), right = Math.min(1, (n + 1) / samples);
      for (let step = 0; step < 32; step++) {
        const a = left + (right - left) / 3, b = right - (right - left) / 3;
        if (error(a) < error(b)) right = b; else left = a;
      }
      const t = (left + right) / 2, d = error(t);
      const projected = toScreen(evaluate(t));
      if (distance(projected, toScreen(segments[i - 1].point)) <= 6 || distance(projected, toScreen(segment.point)) <= 6) continue;
      if (d < bestDistance) { bestDistance = d; best = { index: i, t, originalD: path.getAttribute('d') ?? '' }; }
    }
  }
  return best;
}

/** Split the hit segment without moving the path; return the new anchor index. */
export function insertSvgPathPoint(item: IDesignItem, hit: SvgPathPointInsertion): number | undefined {
  const path = item.element as SVGPathElement;
  if ((path.getAttribute('d') ?? '') !== hit.originalD) return undefined;
  const segments = explicitSegments(path), segment = segments[hit.index], start = segments[hit.index - 1].point;
  const t = hit.t;
  const inserted: IGeometrySegment = { type: segment.type, relative: false, point: evaluator(start, segment)(t) };
  if (segment.type === SegmentType.CubicBezier) {
    const a = mix(start, segment.cp1!, t), b = mix(segment.cp1!, segment.cp2!, t), c = mix(segment.cp2!, segment.point, t);
    inserted.cp1 = a; inserted.cp2 = mix(a, b, t);
    segment.cp1 = mix(b, c, t); segment.cp2 = c;
  } else if (segment.type === SegmentType.QuadraticBezier) {
    inserted.cp1 = mix(start, segment.cp1!, t);
    segment.cp1 = mix(segment.cp1!, segment.point, t);
  } else if (segment.type === SegmentType.Arc) {
    const arc = arcGeometry(start, segment);
    if (arc) {
      inserted.arc = { ...segment.arc!, rx: arc.rx, ry: arc.ry, largeArc: Math.abs(arc.sweep * t) > Math.PI };
      segment.arc = { ...segment.arc!, rx: arc.rx, ry: arc.ry, largeArc: Math.abs(arc.sweep * (1 - t)) > Math.PI };
    } else inserted.type = SegmentType.Line;
  } else if (segment.type === SegmentType.Close) inserted.type = SegmentType.Line;
  const authored = new SvgPathGeometryReader().read(path).segments;
  for (let i = 0; i < segments.length; i++) {
    // Only the split segment and an immediately following shorthand need
    // explicit controls. Preserve all other authored command types.
    if (i !== hit.index && !(i === hit.index + 1 &&
      [SegmentType.SmoothCubic, SegmentType.SmoothQuadratic].includes(authored[i].type))) segments[i] = authored[i];
  }
  segments.splice(hit.index, 0, inserted);
  const geometry = { segments, closed: segments.some(s => s.type === SegmentType.Close) };
  const group = item.openGroup('Add path point');
  // Preserve split precision even when movement is configured to round to pixels.
  item.setAttribute('d', new SvgPathGeometryReader().serialize(geometry)[0].value);
  group.commit();
  return hit.index;
}
