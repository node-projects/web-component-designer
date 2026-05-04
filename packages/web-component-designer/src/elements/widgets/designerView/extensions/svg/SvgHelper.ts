import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import '../../../../helper/PathDataPolyfill.js';
import { createPathD, PathData } from '../../../../helper/PathDataPolyfill.js';

type ProjectiveMatrix = [number, number, number, number, number, number, number, number, number];

interface SvgOverlayTransform {
  bbox: DOMRect;
  matrix: ProjectiveMatrix;
  inverseMatrix: ProjectiveMatrix;
}

interface SvgOverlayPathOptions {
  includeMarkers?: boolean;
}

interface NormalizedPathSegment {
  start: IPoint;
  end: IPoint;
  startAngle: number;
  endAngle: number;
}

interface MarkerPlacement {
  marker: SVGMarkerElement;
  point: IPoint;
  angle: number;
}

interface SvgViewBoxTransform {
  transform: string;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

export function isSupportedSvgGeometryElement(element: Element): element is SVGGraphicsElement {
  return element instanceof SVGPathElement ||
    element instanceof SVGRectElement ||
    element instanceof SVGLineElement ||
    element instanceof SVGCircleElement ||
    element instanceof SVGEllipseElement ||
    element instanceof SVGPolygonElement ||
    element instanceof SVGPolylineElement;
}

export function toOverlayPointFromSvgUserSpace(element: Element, designerCanvas: IDesignerCanvas, point: IPoint): IPoint {
  const transform = _getSvgOverlayTransform(element, designerCanvas);
  if (transform) {
    const local = _toElementReferenceBoxPoint(element, point);
    return _applyProjectiveMatrix(transform.matrix, local.x / transform.bbox.width, local.y / transform.bbox.height);
  }

  const fallbackLocalPoint = _toElementReferenceBoxPoint(element, point);
  const tp = designerCanvas.canvas.convertPointFromNode(fallbackLocalPoint, element, { iframes: designerCanvas.iframes });
  return { x: tp.x, y: tp.y };
}

export function fromOverlayPointToSvgUserSpace(element: Element, designerCanvas: IDesignerCanvas, point: IPoint): IPoint {
  const transform = _getSvgOverlayTransform(element, designerCanvas);
  if (transform) {
    const normalized = _applyProjectiveMatrix(transform.inverseMatrix, point.x, point.y);
    return {
      x: transform.bbox.x + normalized.x * transform.bbox.width,
      y: transform.bbox.y + normalized.y * transform.bbox.height,
    };
  }

  const tp = element.convertPointFromNode({ x: point.x, y: point.y }, designerCanvas.canvas, { iframes: designerCanvas.iframes });
  return _fromElementReferenceBoxPoint(element, { x: tp.x, y: tp.y });
}

export function createOverlayPathDataFromSvgGeometryElement(element: Element, designerCanvas: IDesignerCanvas, options?: SvgOverlayPathOptions): string | null {
  const basePathData = _createOverlayPathDataWithoutMarkers(element, designerCanvas);
  const includeMarkers = options?.includeMarkers !== false;

  if (!includeMarkers) {
    return basePathData;
  }

  const markerPathData = _createMarkerOverlayPathData(element, designerCanvas);
  if (basePathData && markerPathData) {
    return `${basePathData} ${markerPathData}`;
  }

  return basePathData ?? markerPathData;
}

function _createOverlayPathDataWithoutMarkers(element: Element, designerCanvas: IDesignerCanvas): string | null {
  if (!isSupportedSvgGeometryElement(element)) {
    return null;
  }

  const getPathData = (element as any).getPathData as ((options?: { normalize?: boolean }) => PathData[]) | undefined;
  if (!getPathData) {
    return null;
  }

  const sourcePathData = getPathData.call(element, { normalize: true }) ?? [];
  if (!sourcePathData.length) {
    return null;
  }

  const transformedPathData: PathData[] = [];
  let currentPoint: IPoint = { x: 0, y: 0 };
  let subPathStart: IPoint = { x: 0, y: 0 };

  for (const command of sourcePathData) {
    const type = command.type.toUpperCase();
    const isRelative = command.type !== type;
    const values = command.values ?? [];

    const toAbsolute = (x: number, y: number): IPoint => {
      if (isRelative) {
        return { x: currentPoint.x + x, y: currentPoint.y + y };
      }
      return { x, y };
    };

    const toOverlay = (x: number, y: number): IPoint => {
      const absolutePoint = toAbsolute(x, y);
      return toOverlayPointFromSvgUserSpace(element, designerCanvas, absolutePoint);
    };

    switch (type) {
      case 'M': {
        const overlayPoint = toOverlay(values[0], values[1]);
        transformedPathData.push({ type: 'M', values: [overlayPoint.x, overlayPoint.y] } as any);
        currentPoint = toAbsolute(values[0], values[1]);
        subPathStart = { ...currentPoint };
        break;
      }
      case 'L': {
        const overlayPoint = toOverlay(values[0], values[1]);
        transformedPathData.push({ type: 'L', values: [overlayPoint.x, overlayPoint.y] } as any);
        currentPoint = toAbsolute(values[0], values[1]);
        break;
      }
      case 'H': {
        const target = isRelative ? { x: currentPoint.x + values[0], y: currentPoint.y } : { x: values[0], y: currentPoint.y };
        const overlayPoint = toOverlayPointFromSvgUserSpace(element, designerCanvas, target);
        transformedPathData.push({ type: 'L', values: [overlayPoint.x, overlayPoint.y] } as any);
        currentPoint = target;
        break;
      }
      case 'V': {
        const target = isRelative ? { x: currentPoint.x, y: currentPoint.y + values[0] } : { x: currentPoint.x, y: values[0] };
        const overlayPoint = toOverlayPointFromSvgUserSpace(element, designerCanvas, target);
        transformedPathData.push({ type: 'L', values: [overlayPoint.x, overlayPoint.y] } as any);
        currentPoint = target;
        break;
      }
      case 'C': {
        const cp1 = toOverlay(values[0], values[1]);
        const cp2 = toOverlay(values[2], values[3]);
        const end = toOverlay(values[4], values[5]);
        transformedPathData.push({ type: 'C', values: [cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y] } as any);
        currentPoint = toAbsolute(values[4], values[5]);
        break;
      }
      case 'S': {
        const cp2 = toOverlay(values[0], values[1]);
        const end = toOverlay(values[2], values[3]);
        transformedPathData.push({ type: 'S', values: [cp2.x, cp2.y, end.x, end.y] } as any);
        currentPoint = toAbsolute(values[2], values[3]);
        break;
      }
      case 'Q': {
        const cp1 = toOverlay(values[0], values[1]);
        const end = toOverlay(values[2], values[3]);
        transformedPathData.push({ type: 'Q', values: [cp1.x, cp1.y, end.x, end.y] } as any);
        currentPoint = toAbsolute(values[2], values[3]);
        break;
      }
      case 'T': {
        const end = toOverlay(values[0], values[1]);
        transformedPathData.push({ type: 'T', values: [end.x, end.y] } as any);
        currentPoint = toAbsolute(values[0], values[1]);
        break;
      }
      case 'A': {
        const end = toOverlay(values[5], values[6]);
        transformedPathData.push({ type: 'A', values: [values[0], values[1], values[2], values[3], values[4], end.x, end.y] } as any);
        currentPoint = toAbsolute(values[5], values[6]);
        break;
      }
      case 'Z': {
        transformedPathData.push({ type: 'Z', values: [] } as any);
        currentPoint = { ...subPathStart };
        break;
      }
    }
  }

  return createPathD(transformedPathData);
}

function _createMarkerOverlayPathData(element: Element, designerCanvas: IDesignerCanvas): string | null {
  if (!(element instanceof SVGGraphicsElement)) {
    return null;
  }

  const placements = _collectMarkerPlacements(element);
  if (!placements.length) {
    return null;
  }

  const ownerSvg = element.ownerSVGElement;
  if (!ownerSvg) {
    return null;
  }

  const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  tempGroup.setAttribute('visibility', 'hidden');
  tempGroup.setAttribute('pointer-events', 'none');
  ownerSvg.appendChild(tempGroup);

  try {
    const pathParts: string[] = [];

    for (const placement of placements) {
      const markerInstance = _createMarkerInstanceGroup(element, placement);
      if (!markerInstance) {
        continue;
      }

      tempGroup.appendChild(markerInstance);
      const markerGraphics = markerInstance.querySelectorAll('path, rect, line, circle, ellipse, polygon, polyline');
      for (const markerGraphic of markerGraphics) {
        const pathData = _createOverlayPathDataWithoutMarkers(markerGraphic, designerCanvas);
        if (pathData) {
          pathParts.push(pathData);
        }
      }
    }

    return pathParts.length ? pathParts.join(' ') : null;
  } finally {
    tempGroup.remove();
  }
}

function _collectMarkerPlacements(element: SVGGraphicsElement): MarkerPlacement[] {
  const segments = _getNormalizedPathSegments(element);
  if (!segments.length) {
    return [];
  }

  const placements: MarkerPlacement[] = [];
  const startMarker = _resolveMarkerReference(element, 'marker-start');
  const midMarker = _resolveMarkerReference(element, 'marker-mid');
  const endMarker = _resolveMarkerReference(element, 'marker-end');

  if (startMarker) {
    placements.push({
      marker: startMarker,
      point: segments[0].start,
      angle: _resolveMarkerAngle(startMarker, segments[0].startAngle, undefined, true)
    });
  }

  if (midMarker) {
    for (let i = 0; i < segments.length - 1; i++) {
      if (!_pointsEqual(segments[i].end, segments[i + 1].start)) {
        continue;
      }

      placements.push({
        marker: midMarker,
        point: segments[i].end,
        angle: _resolveMarkerAngle(midMarker, segments[i].endAngle, segments[i + 1].startAngle, false)
      });
    }

    if (_pointsEqual(segments[segments.length - 1].end, segments[0].start) && segments.length > 1) {
      placements.push({
        marker: midMarker,
        point: segments[segments.length - 1].end,
        angle: _resolveMarkerAngle(midMarker, segments[segments.length - 1].endAngle, segments[0].startAngle, false)
      });
    }
  }

  if (endMarker) {
    const lastSegment = segments[segments.length - 1];
    placements.push({
      marker: endMarker,
      point: lastSegment.end,
      angle: _resolveMarkerAngle(endMarker, lastSegment.endAngle, undefined, false)
    });
  }

  return placements;
}

function _getNormalizedPathSegments(element: SVGGraphicsElement): NormalizedPathSegment[] {
  const getPathData = (element as any).getPathData as ((options?: { normalize?: boolean }) => PathData[]) | undefined;
  if (!getPathData) {
    return [];
  }

  const pathData = getPathData.call(element, { normalize: true }) ?? [];
  const segments: NormalizedPathSegment[] = [];
  let currentPoint: IPoint = { x: 0, y: 0 };
  let subPathStart: IPoint = { x: 0, y: 0 };

  for (const command of pathData) {
    switch (command.type) {
      case 'M': {
        currentPoint = { x: command.values[0], y: command.values[1] };
        subPathStart = { ...currentPoint };
        break;
      }
      case 'L': {
        const endPoint = { x: command.values[0], y: command.values[1] };
        const angle = _angleBetween(currentPoint, endPoint);
        if (angle != null) {
          segments.push({ start: { ...currentPoint }, end: endPoint, startAngle: angle, endAngle: angle });
        }
        currentPoint = endPoint;
        break;
      }
      case 'C': {
        const cp1 = { x: command.values[0], y: command.values[1] };
        const cp2 = { x: command.values[2], y: command.values[3] };
        const endPoint = { x: command.values[4], y: command.values[5] };
        const startAngle = _getFirstUsableAngle([currentPoint, cp1, cp2, endPoint]);
        const endAngle = _getLastUsableAngle([currentPoint, cp1, cp2, endPoint]);
        if (startAngle != null && endAngle != null) {
          segments.push({ start: { ...currentPoint }, end: endPoint, startAngle, endAngle });
        }
        currentPoint = endPoint;
        break;
      }
      case 'Z': {
        const angle = _angleBetween(currentPoint, subPathStart);
        if (angle != null) {
          segments.push({ start: { ...currentPoint }, end: { ...subPathStart }, startAngle: angle, endAngle: angle });
        }
        currentPoint = { ...subPathStart };
        break;
      }
    }
  }

  return segments;
}

function _resolveMarkerReference(element: SVGGraphicsElement, attributeName: 'marker-start' | 'marker-mid' | 'marker-end'): SVGMarkerElement | null {
  const reference = element.getAttribute(attributeName)?.trim();
  if (!reference) {
    return null;
  }

  const urlMatch = /^url\((['"]?)(.*?)\1\)$/.exec(reference);
  const url = urlMatch?.[2] ?? reference;
  if (!url.startsWith('#')) {
    return null;
  }

  const rootNode = element.getRootNode() as ParentNode;
  const marker = typeof rootNode.querySelector === 'function' ? rootNode.querySelector(url) : null;
  return marker instanceof SVGMarkerElement ? marker : null;
}

function _createMarkerInstanceGroup(sourceElement: SVGGraphicsElement, placement: MarkerPlacement): SVGGElement | null {
  const marker = placement.marker;
  if (!marker.childNodes.length) {
    return null;
  }

  const markerScale = _getMarkerUnitsScale(sourceElement, marker);
  const outerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const transformParts = [
    `translate(${placement.point.x} ${placement.point.y})`,
    `rotate(${placement.angle})`
  ];
  if (markerScale !== 1) {
    transformParts.push(`scale(${markerScale})`);
  }
  outerGroup.setAttribute('transform', transformParts.join(' '));

  const viewBoxTransform = _createViewBoxTransform(marker);
  const mappedRefPoint = _mapMarkerPointToViewport(marker, viewBoxTransform, {
    x: _getAnimatedLengthValue(marker.refX),
    y: _getAnimatedLengthValue(marker.refY)
  });

  const refGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  refGroup.setAttribute('transform', `translate(${-mappedRefPoint.x} ${-mappedRefPoint.y})`);
  outerGroup.appendChild(refGroup);

  const viewBoxGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  if (viewBoxTransform) {
    viewBoxGroup.setAttribute('transform', viewBoxTransform.transform);
  }
  refGroup.appendChild(viewBoxGroup);

  for (const childNode of Array.from(marker.childNodes)) {
    viewBoxGroup.appendChild(childNode.cloneNode(true));
  }

  return outerGroup;
}

function _getMarkerUnitsScale(sourceElement: SVGGraphicsElement, marker: SVGMarkerElement): number {
  if (marker.getAttribute('markerUnits') === 'userSpaceOnUse') {
    return 1;
  }

  const strokeWidth = parseFloat(getComputedStyle(sourceElement).strokeWidth);
  return Number.isFinite(strokeWidth) && strokeWidth > 0 ? strokeWidth : 1;
}

function _createViewBoxTransform(marker: SVGMarkerElement): SvgViewBoxTransform | null {
  const viewBox = marker.viewBox.baseVal;
  if (viewBox == null || (viewBox.width === 0 && viewBox.height === 0)) {
    return null;
  }

  const viewportWidth = _getAnimatedLengthValue(marker.markerWidth);
  const viewportHeight = _getAnimatedLengthValue(marker.markerHeight);
  if (!viewportWidth || !viewportHeight || !viewBox.width || !viewBox.height) {
    return null;
  }

  const preserveAspectRatio = marker.preserveAspectRatio.baseVal;
  let scaleX = viewportWidth / viewBox.width;
  let scaleY = viewportHeight / viewBox.height;
  let translateX = -viewBox.x * scaleX;
  let translateY = -viewBox.y * scaleY;

  if (preserveAspectRatio.align !== SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_NONE) {
    const uniformScale = preserveAspectRatio.meetOrSlice === SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE
      ? Math.max(scaleX, scaleY)
      : Math.min(scaleX, scaleY);

    scaleX = uniformScale;
    scaleY = uniformScale;

    const extraWidth = viewportWidth - viewBox.width * uniformScale;
    const extraHeight = viewportHeight - viewBox.height * uniformScale;
    const { xAlign, yAlign } = _getAlignFactors(preserveAspectRatio.align);
    translateX = -viewBox.x * uniformScale + extraWidth * xAlign;
    translateY = -viewBox.y * uniformScale + extraHeight * yAlign;
  }

  return {
    transform: `matrix(${scaleX} 0 0 ${scaleY} ${translateX} ${translateY})`,
    scaleX,
    scaleY,
    translateX,
    translateY,
  };
}

function _mapMarkerPointToViewport(marker: SVGMarkerElement, viewBoxTransform: SvgViewBoxTransform | null, point: IPoint): IPoint {
  if (!viewBoxTransform) {
    return point;
  }

  return {
    x: point.x * viewBoxTransform.scaleX + viewBoxTransform.translateX,
    y: point.y * viewBoxTransform.scaleY + viewBoxTransform.translateY,
  };
}

function _getAlignFactors(align: number): { xAlign: number; yAlign: number } {
  switch (align) {
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMIDYMIN:
      return { xAlign: 0.5, yAlign: 0 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMAXYMIN:
      return { xAlign: 1, yAlign: 0 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMINYMID:
      return { xAlign: 0, yAlign: 0.5 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMIDYMID:
      return { xAlign: 0.5, yAlign: 0.5 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMAXYMID:
      return { xAlign: 1, yAlign: 0.5 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMINYMAX:
      return { xAlign: 0, yAlign: 1 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMIDYMAX:
      return { xAlign: 0.5, yAlign: 1 };
    case SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMAXYMAX:
      return { xAlign: 1, yAlign: 1 };
    default:
      return { xAlign: 0, yAlign: 0 };
  }
}

function _resolveMarkerAngle(marker: SVGMarkerElement, incomingAngle: number, outgoingAngle?: number, isStartMarker?: boolean): number {
  const orient = marker.orientType.baseVal === SVGMarkerElement.SVG_MARKER_ORIENT_AUTO ? 'auto' : marker.getAttribute('orient')?.trim() ?? '0';
  if (orient === 'auto' || orient === 'auto-start-reverse') {
    let angle = outgoingAngle == null ? incomingAngle : _bisectAngles(incomingAngle, outgoingAngle);
    if (isStartMarker && orient === 'auto-start-reverse') {
      angle += 180;
    }
    return angle;
  }

  return _parseAngle(orient);
}

function _parseAngle(value: string): number {
  if (value.endsWith('rad')) {
    return parseFloat(value) * 180 / Math.PI;
  }
  if (value.endsWith('turn')) {
    return parseFloat(value) * 360;
  }
  if (value.endsWith('grad')) {
    return parseFloat(value) * 0.9;
  }
  return parseFloat(value);
}

function _bisectAngles(angleA: number, angleB: number): number {
  const vectorA = { x: Math.cos(angleA * Math.PI / 180), y: Math.sin(angleA * Math.PI / 180) };
  const vectorB = { x: Math.cos(angleB * Math.PI / 180), y: Math.sin(angleB * Math.PI / 180) };
  const sum = { x: vectorA.x + vectorB.x, y: vectorA.y + vectorB.y };

  if (Math.abs(sum.x) < 1e-10 && Math.abs(sum.y) < 1e-10) {
    return angleB;
  }

  return Math.atan2(sum.y, sum.x) * 180 / Math.PI;
}

function _getFirstUsableAngle(points: IPoint[]): number | null {
  for (let i = 0; i < points.length - 1; i++) {
    const angle = _angleBetween(points[i], points[i + 1]);
    if (angle != null) {
      return angle;
    }
  }
  return null;
}

function _getLastUsableAngle(points: IPoint[]): number | null {
  for (let i = points.length - 1; i > 0; i--) {
    const angle = _angleBetween(points[i - 1], points[i]);
    if (angle != null) {
      return angle;
    }
  }
  return null;
}

function _angleBetween(start: IPoint, end: IPoint): number | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
    return null;
  }
  return Math.atan2(dy, dx) * 180 / Math.PI;
}

function _pointsEqual(a: IPoint, b: IPoint): boolean {
  return Math.abs(a.x - b.x) < 1e-10 && Math.abs(a.y - b.y) < 1e-10;
}

function _getAnimatedLengthValue(length: SVGAnimatedLength): number {
  return length?.baseVal?.value ?? 0;
}

function _toElementReferenceBoxPoint(element: Element, point: IPoint): IPoint {
  const bbox = _getSvgGeometryBBoxOffset(element);
  return { x: point.x - bbox.x, y: point.y - bbox.y };
}

function _fromElementReferenceBoxPoint(element: Element, point: IPoint): IPoint {
  const bbox = _getSvgGeometryBBoxOffset(element);
  return { x: point.x + bbox.x, y: point.y + bbox.y };
}

function _getSvgGeometryBBoxOffset(element: Element): IPoint {
  if (!(element instanceof SVGGraphicsElement) || element instanceof SVGSVGElement) {
    return { x: 0, y: 0 };
  }

  const bbox = element.getBBox();
  return { x: bbox.x, y: bbox.y };
}

function _getSvgOverlayTransform(element: Element, designerCanvas: IDesignerCanvas): SvgOverlayTransform | null {
  if (!(element instanceof SVGGraphicsElement) || element instanceof SVGSVGElement) {
    return null;
  }

  const bbox = element.getBBox();
  if (Math.abs(bbox.width) < 1e-10 || Math.abs(bbox.height) < 1e-10) {
    return null;
  }

  const quad = element.getBoxQuads({ relativeTo: designerCanvas.canvas, iframes: designerCanvas.iframes })[0];
  if (!quad) {
    return null;
  }

  const matrix = _createProjectiveMatrixForQuad(quad);
  if (!matrix) {
    return null;
  }

  const inverseMatrix = _invertProjectiveMatrix(matrix);
  if (!inverseMatrix) {
    return null;
  }

  return { bbox, matrix, inverseMatrix };
}

function _createProjectiveMatrixForQuad(quad: DOMQuad): ProjectiveMatrix | null {
  const x1 = quad.p1.x;
  const y1 = quad.p1.y;
  const x2 = quad.p2.x;
  const y2 = quad.p2.y;
  const x3 = quad.p3.x;
  const y3 = quad.p3.y;
  const x4 = quad.p4.x;
  const y4 = quad.p4.y;

  const sx = x1 - x2 + x3 - x4;
  const sy = y1 - y2 + y3 - y4;
  const dx1 = x2 - x3;
  const dy1 = y2 - y3;
  const dx2 = x4 - x3;
  const dy2 = y4 - y3;

  let g = 0;
  let h = 0;

  if (Math.abs(sx) >= 1e-10 || Math.abs(sy) >= 1e-10) {
    const denominator = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denominator) < 1e-10) {
      return null;
    }

    g = (sx * dy2 - sy * dx2) / denominator;
    h = (dx1 * sy - dy1 * sx) / denominator;
  }

  return [
    x2 - x1 + g * x2,
    x4 - x1 + h * x4,
    x1,
    y2 - y1 + g * y2,
    y4 - y1 + h * y4,
    y1,
    g,
    h,
    1,
  ];
}

function _applyProjectiveMatrix(matrix: ProjectiveMatrix, x: number, y: number): IPoint {
  const projectedX = matrix[0] * x + matrix[1] * y + matrix[2];
  const projectedY = matrix[3] * x + matrix[4] * y + matrix[5];
  const projectedW = matrix[6] * x + matrix[7] * y + matrix[8];
  const safeW = Math.abs(projectedW) < 1e-10 ? (projectedW < 0 ? -1e-10 : 1e-10) : projectedW;
  return {
    x: projectedX / safeW,
    y: projectedY / safeW,
  };
}

function _invertProjectiveMatrix(matrix: ProjectiveMatrix): ProjectiveMatrix | null {
  const determinant =
    matrix[0] * (matrix[4] * matrix[8] - matrix[5] * matrix[7]) -
    matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
    matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);

  if (Math.abs(determinant) < 1e-10) {
    return null;
  }

  const inverseDeterminant = 1 / determinant;
  return [
    (matrix[4] * matrix[8] - matrix[5] * matrix[7]) * inverseDeterminant,
    (matrix[2] * matrix[7] - matrix[1] * matrix[8]) * inverseDeterminant,
    (matrix[1] * matrix[5] - matrix[2] * matrix[4]) * inverseDeterminant,
    (matrix[5] * matrix[6] - matrix[3] * matrix[8]) * inverseDeterminant,
    (matrix[0] * matrix[8] - matrix[2] * matrix[6]) * inverseDeterminant,
    (matrix[2] * matrix[3] - matrix[0] * matrix[5]) * inverseDeterminant,
    (matrix[3] * matrix[7] - matrix[4] * matrix[6]) * inverseDeterminant,
    (matrix[1] * matrix[6] - matrix[0] * matrix[7]) * inverseDeterminant,
    (matrix[0] * matrix[4] - matrix[1] * matrix[3]) * inverseDeterminant,
  ];
}