import { IPoint } from '../../interfaces/IPoint.js';

function normalize(vector: IPoint) {
  const length = Math.hypot(vector.x, vector.y);
  if (length < 1e-8) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / length, y: vector.y / length };
}

export function getQuadCenter(quad: DOMQuad): IPoint {
  return {
    x: (quad.p1.x + quad.p2.x + quad.p3.x + quad.p4.x) / 4,
    y: (quad.p1.y + quad.p2.y + quad.p3.y + quad.p4.y) / 4
  };
}

export function getEdgeMidpoint(start: IPoint, end: IPoint): IPoint {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
}

export function getOutwardNormal(start: IPoint, end: IPoint, quadCenter: IPoint, fallback: IPoint): IPoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let normal = normalize({ x: -dy, y: dx });
  if (normal.x === 0 && normal.y === 0) {
    normal = normalize(fallback);
  }

  const midpoint = getEdgeMidpoint(start, end);
  const toCenter = { x: quadCenter.x - midpoint.x, y: quadCenter.y - midpoint.y };
  if ((normal.x * toCenter.x) + (normal.y * toCenter.y) > 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  return normal;
}

export function getEdgeOffsetPoint(start: IPoint, end: IPoint, quadCenter: IPoint, distance: number, fallback: IPoint): IPoint {
  const midpoint = getEdgeMidpoint(start, end);
  const normal = getOutwardNormal(start, end, quadCenter, fallback);
  return {
    x: midpoint.x + (normal.x * distance),
    y: midpoint.y + (normal.y * distance)
  };
}