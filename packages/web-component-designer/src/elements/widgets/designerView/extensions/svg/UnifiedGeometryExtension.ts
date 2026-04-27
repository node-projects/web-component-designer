import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { IPoint } from '../../../../../interfaces/IPoint.js';
import { EventNames } from '../../../../../enums/EventNames.js';
import { ContextMenu } from '../../../../helper/contextMenu/ContextMenu.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { OverlayLayer } from '../OverlayLayer.js';
import { IGeometry, IGeometryReader, IGeometrySegment, SegmentType } from './geometry/IGeometry.js';
import { getGeometryReader } from './geometry/GeometryReaderFactory.js';
import { applyGeometryWritesToDesignItem, applyGeometryWritesToElement } from './geometry/GeometryWriteHelper.js';

interface DragState {
  startCursorPos: IPoint;
  segmentIndex: number;
  handleType: 'anchor' | 'cp1' | 'cp2';
  originalPoint: IPoint;
  originalSegments: { point: IPoint; cp1?: IPoint; cp2?: IPoint }[];
  startScrollOffset: IPoint;
}

type ProjectiveMatrix = [number, number, number, number, number, number, number, number, number];

interface SvgOverlayTransform {
  bbox: DOMRect;
  matrix: ProjectiveMatrix;
  inverseMatrix: ProjectiveMatrix;
}

export interface UnifiedGeometryExtensionOptions {
  allowShapeDrag?: boolean;
}

export class UnifiedGeometryExtension extends AbstractExtension {

  private _geometry: IGeometry | null = null;
  private _reader: IGeometryReader | undefined;
  private _dragState: DragState | null = null;
  private _options: UnifiedGeometryExtensionOptions;
  private _overlayStructureSignature: string | null = null;
  private _eventCleanups: (() => void)[] = [];
  /** Map from 'anchor-{index}', 'cp1-{index}', 'cp2-{index}' to overlay circle */
  private _overlayCircles: Map<string, SVGCircleElement> = new Map();
  /** Lines for control point connections */
  private _overlayLines: SVGLineElement[] = [];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, reader?: IGeometryReader, options?: UnifiedGeometryExtensionOptions) {
    super(extensionManager, designerView, extendedItem);
    this._reader = reader ?? getGeometryReader(extendedItem.element);
    this._options = options ?? {};
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    if (!this._reader) {
      this._cleanupAll();
      return;
    }

    this._geometry = this._reader.read(this.extendedItem.element);
    if (!this._geometry) {
      this._cleanupAll();
      return;
    }

    const structureSignature = this._getOverlayStructureSignature(this._geometry);
    const shouldRebuild = this._overlayStructureSignature !== structureSignature || this._hasOverlayStructureMismatch(this._geometry);

    if (shouldRebuild) {
      this._cleanupAll();
      this._overlayStructureSignature = structureSignature;
      this._drawOverlays();
      return;
    }

    if (!this._valuesHaveChanges(...this._getRefreshValues(this._geometry))) {
      return;
    }

    this._updateOverlayAppearance();
    this._updateOverlayPositions();
  }

  override dispose() {
    this._cleanupAll();
    this._geometry = null;
    this._dragState = null;
  }

  private _cleanupAll() {
    for (const cleanup of this._eventCleanups) {
      try { cleanup(); } catch { /* ignore */ }
    }
    this._eventCleanups = [];
    this._overlayStructureSignature = null;
    this._overlayCircles.clear();
    this._overlayLines = [];
    this._removeAllOverlays();
  }

  private _getOverlayStructureSignature(geometry: IGeometry): string {
    return geometry.segments.map(segment => `${segment.type}:${segment.cp1 ? 1 : 0}:${segment.cp2 ? 1 : 0}`).join('|');
  }

  private _hasOverlayStructureMismatch(geometry: IGeometry): boolean {
    let expectedLines = 0;
    let expectedCircles = 0;

    for (let i = 0; i < geometry.segments.length; i++) {
      const segment = geometry.segments[i];
      if (segment.type === SegmentType.Close) {
        continue;
      }

      if (this._shouldRenderAnchorHandle(i, segment, geometry)) {
        expectedCircles++;
      }
      if (segment.cp1) {
        expectedCircles++;
        expectedLines++;
        if (segment.type === SegmentType.QuadraticBezier) {
          expectedLines++;
        }
      }
      if (segment.cp2) {
        expectedCircles++;
        expectedLines++;
      }
    }

    return this._overlayCircles.size !== expectedCircles || this._overlayLines.length !== expectedLines;
  }

  private _getRefreshValues(geometry: IGeometry): (number | string)[] {
    const transformedBoxQuad = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    const values: (number | string)[] = [
      this.designerCanvas.zoomFactor,
      this.designerCanvas.scaleFactor,
      this._overlayStructureSignature ?? ''
    ];

    if (transformedBoxQuad) {
      values.push(
        transformedBoxQuad.p1.x,
        transformedBoxQuad.p1.y,
        transformedBoxQuad.p2.x,
        transformedBoxQuad.p2.y,
        transformedBoxQuad.p3.x,
        transformedBoxQuad.p3.y,
        transformedBoxQuad.p4.x,
        transformedBoxQuad.p4.y
      );
    }

    for (const segment of geometry.segments) {
      values.push(segment.type, segment.point.x, segment.point.y);
      if (segment.cp1) {
        values.push(segment.cp1.x, segment.cp1.y);
      } else {
        values.push('cp1:none');
      }
      if (segment.cp2) {
        values.push(segment.cp2.x, segment.cp2.y);
      } else {
        values.push('cp2:none');
      }
    }

    return values;
  }

  /** Convert an SVG user-space coordinate to overlay (canvas) coordinates. */
  private _toOverlay(p: IPoint): IPoint {
    const transform = this._getSvgOverlayTransform();
    if (transform) {
      return this._mapSvgPointToOverlay(p, transform);
    }

    const fallbackLocalPoint = this._toElementReferenceBoxPoint(p);
    const tp = this.designerCanvas.canvas.convertPointFromNode(fallbackLocalPoint, this.extendedItem.element, { iframes: this.designerCanvas.iframes });
    return { x: tp.x, y: tp.y };
  }

  /** Convert overlay (canvas) coordinates back to SVG user-space. */
  private _fromOverlay(p: IPoint): IPoint {
    const transform = this._getSvgOverlayTransform();
    if (transform) {
      return this._mapOverlayPointToSvg(p, transform);
    }

    const tp = this.extendedItem.element.convertPointFromNode({ x: p.x, y: p.y }, this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });
    return this._fromElementReferenceBoxPoint({ x: tp.x, y: tp.y });
  }

  private _getSvgOverlayTransform(): SvgOverlayTransform | null {
    const element = this.extendedItem.element;
    if (!(element instanceof SVGGraphicsElement) || element instanceof SVGSVGElement) {
      return null;
    }

    const bbox = element.getBBox();
    if (Math.abs(bbox.width) < 1e-10 || Math.abs(bbox.height) < 1e-10) {
      return null;
    }

    const quad = element.getBoxQuads({ relativeTo: this.designerCanvas.canvas, iframes: this.designerCanvas.iframes })[0];
    if (!quad) {
      return null;
    }

    const matrix = this._createProjectiveMatrixForQuad(quad);
    if (!matrix) {
      return null;
    }

    const inverseMatrix = this._invertProjectiveMatrix(matrix);
    if (!inverseMatrix) {
      return null;
    }

    return { bbox, matrix, inverseMatrix };
  }

  private _mapSvgPointToOverlay(p: IPoint, transform: SvgOverlayTransform): IPoint {
    const local = this._toElementReferenceBoxPoint(p);
    return this._applyProjectiveMatrix(transform.matrix, local.x / transform.bbox.width, local.y / transform.bbox.height);
  }

  private _mapOverlayPointToSvg(p: IPoint, transform: SvgOverlayTransform): IPoint {
    const normalized = this._applyProjectiveMatrix(transform.inverseMatrix, p.x, p.y);
    return {
      x: transform.bbox.x + normalized.x * transform.bbox.width,
      y: transform.bbox.y + normalized.y * transform.bbox.height,
    };
  }

  private _createProjectiveMatrixForQuad(quad: DOMQuad): ProjectiveMatrix | null {
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

  private _applyProjectiveMatrix(matrix: ProjectiveMatrix, x: number, y: number): IPoint {
    const projectedX = matrix[0] * x + matrix[1] * y + matrix[2];
    const projectedY = matrix[3] * x + matrix[4] * y + matrix[5];
    const projectedW = matrix[6] * x + matrix[7] * y + matrix[8];
    const safeW = Math.abs(projectedW) < 1e-10 ? (projectedW < 0 ? -1e-10 : 1e-10) : projectedW;
    return {
      x: projectedX / safeW,
      y: projectedY / safeW,
    };
  }

  private _invertProjectiveMatrix(matrix: ProjectiveMatrix): ProjectiveMatrix | null {
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

  private _toElementReferenceBoxPoint(p: IPoint): IPoint {
    const bbox = this._getSvgGeometryBBoxOffset();
    return { x: p.x - bbox.x, y: p.y - bbox.y };
  }

  private _fromElementReferenceBoxPoint(p: IPoint): IPoint {
    const bbox = this._getSvgGeometryBBoxOffset();
    return { x: p.x + bbox.x, y: p.y + bbox.y };
  }

  private _getSvgGeometryBBoxOffset(): IPoint {
    const element = this.extendedItem.element;
    if (!(element instanceof SVGGraphicsElement) || element instanceof SVGSVGElement) {
      return { x: 0, y: 0 };
    }

    const bbox = element.getBBox();
    return { x: bbox.x, y: bbox.y };
  }

  private _drawOverlays() {
    if (!this._geometry) return;

    let prevAnchor: IPoint | null = null;

    for (let i = 0; i < this._geometry.segments.length; i++) {
      const seg = this._geometry.segments[i];

      if (seg.type === SegmentType.Close) {
        prevAnchor = this._geometry.segments[0]?.point ?? null;
        continue;
      }

      // Draw control point handles and dashed lines for bezier segments
      if (seg.cp1) {
        const cp1Overlay = this._toOverlay(seg.cp1);
        if (prevAnchor) {
          const prevOverlay = this._toOverlay(prevAnchor);
          const line = this._drawLine(prevOverlay.x, prevOverlay.y, cp1Overlay.x, cp1Overlay.y, 'svg-control-line');
          this._overlayLines.push(line);
        }
        if (seg.type === SegmentType.QuadraticBezier) {
          const anchorOverlay = this._toOverlay(seg.point);
          const line = this._drawLine(anchorOverlay.x, anchorOverlay.y, cp1Overlay.x, cp1Overlay.y, 'svg-control-line');
          this._overlayLines.push(line);
        }
        this._drawControlCircle(cp1Overlay, i, 'cp1');
      }

      if (seg.cp2) {
        const cp2Overlay = this._toOverlay(seg.cp2);
        const anchorOverlay = this._toOverlay(seg.point);
        const line = this._drawLine(anchorOverlay.x, anchorOverlay.y, cp2Overlay.x, cp2Overlay.y, 'svg-control-line');
        this._overlayLines.push(line);
        this._drawControlCircle(cp2Overlay, i, 'cp2');
      }

      // Draw the anchor point
      if (this._shouldRenderAnchorHandle(i, seg, this._geometry)) {
        const overlayPt = this._toOverlay(seg.point);
        this._drawAnchorCircle(overlayPt, i, seg);
      }

      prevAnchor = seg.point;
    }

    this._updateOverlayAppearance();
  }

  private _updateOverlayAppearance() {
    const anchorRadius = 5 / this.designerCanvas.scaleFactor;
    const controlRadius = 4 / this.designerCanvas.scaleFactor;
    const strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    const dashArray = (4 / this.designerCanvas.scaleFactor).toString();

    for (const [key, circle] of this._overlayCircles) {
      circle.setAttribute('r', (key.startsWith('anchor-') ? anchorRadius : controlRadius).toString());
      circle.style.strokeWidth = strokeWidth;
    }

    for (const line of this._overlayLines) {
      line.style.strokeDasharray = dashArray;
      line.style.strokeWidth = strokeWidth;
    }
  }

  private _addTrackedListener(el: Element, event: string, handler: (e: any) => void) {
    el.addEventListener(event, handler);
    this._eventCleanups.push(() => el.removeEventListener(event, handler));
  }

  private _drawAnchorCircle(overlayPt: IPoint, segIndex: number, seg: IGeometrySegment) {
    const r = 5 / this.designerCanvas.scaleFactor;
    const circle = this._drawCircle(overlayPt.x, overlayPt.y, r, 'svg-path', undefined, OverlayLayer.Foreground);
    circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    circle.style.cursor = 'move';
    this._overlayCircles.set(`anchor-${segIndex}`, circle);

    const onDown = (e: PointerEvent) => this._onPointerDown(e, circle, segIndex, 'anchor');
    const onMove = (e: PointerEvent) => this._onPointerMove(e, circle, segIndex, 'anchor');
    const onUp = (e: PointerEvent) => this._onPointerUp(e, segIndex);
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      this._showContextMenu(e, segIndex, seg);
    };

    this._addTrackedListener(circle, EventNames.PointerDown, onDown);
    this._addTrackedListener(circle, EventNames.PointerMove, onMove);
    this._addTrackedListener(circle, EventNames.PointerUp, onUp);
    this._addTrackedListener(circle, EventNames.ContextMenu, onCtx);
  }

  private _drawControlCircle(overlayPt: IPoint, segIndex: number, handleType: 'cp1' | 'cp2') {
    const r = 4 / this.designerCanvas.scaleFactor;
    const circle = this._drawCircle(overlayPt.x, overlayPt.y, r, 'svg-control-point', undefined, OverlayLayer.Foreground);
    circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    circle.style.cursor = 'move';
    this._overlayCircles.set(`${handleType}-${segIndex}`, circle);

    const onDown = (e: PointerEvent) => this._onPointerDown(e, circle, segIndex, handleType);
    const onMove = (e: PointerEvent) => this._onPointerMove(e, circle, segIndex, handleType);
    const onUp = (e: PointerEvent) => this._onPointerUp(e, segIndex);

    this._addTrackedListener(circle, EventNames.PointerDown, onDown);
    this._addTrackedListener(circle, EventNames.PointerMove, onMove);
    this._addTrackedListener(circle, EventNames.PointerUp, onUp);
  }

  // -- Pointer event handlers --

  private _onPointerDown(event: PointerEvent, circle: SVGCircleElement, segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2') {
    event.stopPropagation();
    event.preventDefault();
    (event.target as Element).setPointerCapture(event.pointerId);
    const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

    if (!this._geometry) return;

    const seg = this._geometry.segments[segIndex];
    let originalPoint: IPoint;

    if (handleType === 'anchor') {
      originalPoint = { ...seg.point };
    } else if (handleType === 'cp1') {
      originalPoint = { ...seg.cp1! };
    } else {
      originalPoint = { ...seg.cp2! };
    }

    const originalSegments = this._geometry.segments.map(s => ({
      point: { ...s.point },
      cp1: s.cp1 ? { ...s.cp1 } : undefined,
      cp2: s.cp2 ? { ...s.cp2 } : undefined,
    }));

    this._dragState = {
      startCursorPos: cursorPos,
      segmentIndex: segIndex,
      handleType,
      originalPoint,
      originalSegments,
      startScrollOffset: this.designerCanvas.canvasOffset,
    };
  }

  private _onPointerMove(event: PointerEvent, circle: SVGCircleElement, segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2') {
    event.stopPropagation();
    event.preventDefault();
    if (!this._dragState || !this._geometry || event.buttons === 0) return;
    if (this._dragState.segmentIndex !== segIndex || this._dragState.handleType !== handleType) return;

    const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);
    let dx = cursorPos.x - this._dragState.startCursorPos.x;
    let dy = cursorPos.y - this._dragState.startCursorPos.y;

    // Shift key: constrain to axis
    if (event.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    // Alt key + anchor drag: move entire shape
    if (event.altKey && handleType === 'anchor' && this._options.allowShapeDrag !== false) {
      this._dragWholeShape(dx, dy);
    } else {
      this._dragSingleHandle(segIndex, handleType, dx, dy);
    }

    // Update geometry model
    this._applyGeometryToElement();
    // Update overlay positions in-place (no recreate to preserve pointer capture)
    this._updateOverlayPositions();
    this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);
  }

  private _dragSingleHandle(segIndex: number, handleType: string, dx: number, dy: number) {
    const origOverlay = this._toOverlay(this._dragState!.originalPoint);
    const newOverlay: IPoint = { x: origOverlay.x + dx, y: origOverlay.y + dy };
    const newLocal = this._fromOverlay(newOverlay);

    const seg = this._geometry!.segments[segIndex];

    if (handleType === 'anchor') {
      if (this.extendedItem.element instanceof SVGRectElement && this._dragRectCorner(segIndex, newLocal)) {
        return;
      }
      if (this.extendedItem.element instanceof SVGCircleElement && this._dragCircleCardinal(segIndex, newLocal)) {
        return;
      }
      if (this.extendedItem.element instanceof SVGEllipseElement && this._dragEllipseCardinal(segIndex, newLocal)) {
        return;
      }
      seg.point.x = newLocal.x;
      seg.point.y = newLocal.y;
    } else if (handleType === 'cp1') {
      seg.cp1!.x = newLocal.x;
      seg.cp1!.y = newLocal.y;
    } else {
      seg.cp2!.x = newLocal.x;
      seg.cp2!.y = newLocal.y;
    }
  }

  private _dragRectCorner(segIndex: number, newPoint: IPoint): boolean {
    if (!this._geometry || !this._dragState?.originalSegments) return false;
    if (this._geometry.segments.length < 4 || segIndex < 0 || segIndex > 3) return false;

    const originalSegments = this._dragState.originalSegments;

    switch (segIndex) {
      case 0:
        this._setRectCornerPoints(
          newPoint,
          { x: originalSegments[2].point.x, y: newPoint.y },
          { ...originalSegments[2].point },
          { x: newPoint.x, y: originalSegments[2].point.y }
        );
        break;
      case 1:
        this._setRectCornerPoints(
          { x: originalSegments[3].point.x, y: newPoint.y },
          newPoint,
          { x: newPoint.x, y: originalSegments[3].point.y },
          { ...originalSegments[3].point }
        );
        break;
      case 2:
        this._setRectCornerPoints(
          { ...originalSegments[0].point },
          { x: newPoint.x, y: originalSegments[0].point.y },
          newPoint,
          { x: originalSegments[0].point.x, y: newPoint.y }
        );
        break;
      case 3:
        this._setRectCornerPoints(
          { x: newPoint.x, y: originalSegments[1].point.y },
          { ...originalSegments[1].point },
          { x: originalSegments[1].point.x, y: newPoint.y },
          newPoint
        );
        break;
      default:
        return false;
    }

    const closeSegment = this._geometry.segments[4];
    if (closeSegment?.type === SegmentType.Close) {
      closeSegment.point = { ...this._geometry.segments[0].point };
    }

    return true;
  }

  private _setRectCornerPoints(topLeft: IPoint, topRight: IPoint, bottomRight: IPoint, bottomLeft: IPoint) {
    this._geometry!.segments[0].point = { ...topLeft };
    this._geometry!.segments[1].point = { ...topRight };
    this._geometry!.segments[2].point = { ...bottomRight };
    this._geometry!.segments[3].point = { ...bottomLeft };
  }

  private _dragCircleCardinal(segIndex: number, newPoint: IPoint): boolean {
    if (!this._geometry || !this._dragState?.originalSegments) return false;

    const cardinalIndex = this._normalizeCardinalIndex(segIndex);
    if (cardinalIndex === null) return false;

    const original = this._dragState.originalSegments;
    const centerX = (original[1].point.x + original[3].point.x) / 2;
    const centerY = (original[0].point.y + original[2].point.y) / 2;

    let cx = centerX;
    let cy = centerY;
    let radius = Math.abs(original[1].point.x - original[3].point.x) / 2;

    switch (cardinalIndex) {
      case 0: {
        const oppositeY = original[2].point.y;
        cy = (newPoint.y + oppositeY) / 2;
        radius = Math.abs(oppositeY - newPoint.y) / 2;
        break;
      }
      case 1: {
        const oppositeX = original[3].point.x;
        cx = (newPoint.x + oppositeX) / 2;
        radius = Math.abs(newPoint.x - oppositeX) / 2;
        break;
      }
      case 2: {
        const oppositeY = original[0].point.y;
        cy = (original[0].point.y + newPoint.y) / 2;
        radius = Math.abs(newPoint.y - oppositeY) / 2;
        break;
      }
      case 3: {
        const oppositeX = original[1].point.x;
        cx = (oppositeX + newPoint.x) / 2;
        radius = Math.abs(oppositeX - newPoint.x) / 2;
        break;
      }
      default:
        return false;
    }

    this._setCardinalArcPoints(cx, cy, radius, radius);
    return true;
  }

  private _dragEllipseCardinal(segIndex: number, newPoint: IPoint): boolean {
    if (!this._geometry || !this._dragState?.originalSegments) return false;

    const cardinalIndex = this._normalizeCardinalIndex(segIndex);
    if (cardinalIndex === null) return false;

    const original = this._dragState.originalSegments;
    let cx = (original[1].point.x + original[3].point.x) / 2;
    let cy = (original[0].point.y + original[2].point.y) / 2;
    let rx = Math.abs(original[1].point.x - original[3].point.x) / 2;
    let ry = Math.abs(original[2].point.y - original[0].point.y) / 2;

    switch (cardinalIndex) {
      case 0: {
        const oppositeY = original[2].point.y;
        cy = (newPoint.y + oppositeY) / 2;
        ry = Math.abs(oppositeY - newPoint.y) / 2;
        break;
      }
      case 1: {
        const oppositeX = original[3].point.x;
        cx = (newPoint.x + oppositeX) / 2;
        rx = Math.abs(newPoint.x - oppositeX) / 2;
        break;
      }
      case 2: {
        const oppositeY = original[0].point.y;
        cy = (oppositeY + newPoint.y) / 2;
        ry = Math.abs(newPoint.y - oppositeY) / 2;
        break;
      }
      case 3: {
        const oppositeX = original[1].point.x;
        cx = (oppositeX + newPoint.x) / 2;
        rx = Math.abs(oppositeX - newPoint.x) / 2;
        break;
      }
      default:
        return false;
    }

    this._setCardinalArcPoints(cx, cy, rx, ry);
    return true;
  }

  private _normalizeCardinalIndex(segIndex: number): 0 | 1 | 2 | 3 | null {
    if (segIndex >= 0 && segIndex <= 3) {
      return segIndex as 0 | 1 | 2 | 3;
    }
    if (segIndex === 4) {
      return 0;
    }
    return null;
  }

  private _setCardinalArcPoints(cx: number, cy: number, rx: number, ry: number) {
    if (!this._geometry) return;

    this._geometry.segments[0].point = { x: cx, y: cy - ry };
    this._geometry.segments[1].point = { x: cx + rx, y: cy };
    this._geometry.segments[2].point = { x: cx, y: cy + ry };
    this._geometry.segments[3].point = { x: cx - rx, y: cy };

    if (this._geometry.segments[1].arc) {
      this._geometry.segments[1].arc.rx = rx;
      this._geometry.segments[1].arc.ry = ry;
    }
    if (this._geometry.segments[2].arc) {
      this._geometry.segments[2].arc.rx = rx;
      this._geometry.segments[2].arc.ry = ry;
    }
    if (this._geometry.segments[3].arc) {
      this._geometry.segments[3].arc.rx = rx;
      this._geometry.segments[3].arc.ry = ry;
    }
    if (this._geometry.segments[4]?.arc) {
      this._geometry.segments[4].point = { x: cx, y: cy - ry };
      this._geometry.segments[4].arc.rx = rx;
      this._geometry.segments[4].arc.ry = ry;
    }
    if (this._geometry.segments[5]?.type === SegmentType.Close) {
      this._geometry.segments[5].point = { x: cx, y: cy - ry };
    }
  }

  private _shouldRenderAnchorHandle(segIndex: number, seg: IGeometrySegment, geometry: IGeometry): boolean {
    if (!(this.extendedItem.element instanceof SVGCircleElement) && !(this.extendedItem.element instanceof SVGEllipseElement)) {
      return true;
    }

    if (segIndex !== 4) {
      return true;
    }

    const firstSegment = geometry.segments[0];
    return seg.point.x !== firstSegment?.point.x || seg.point.y !== firstSegment?.point.y;
  }

  private _dragWholeShape(dx: number, dy: number) {
    if (!this._dragState?.originalSegments || !this._geometry) return;

    for (let i = 0; i < this._geometry.segments.length; i++) {
      const orig = this._dragState.originalSegments[i];
      const seg = this._geometry.segments[i];

      const origOverlay = this._toOverlay(orig.point);
      const newOverlay: IPoint = { x: origOverlay.x + dx, y: origOverlay.y + dy };
      const newLocal = this._fromOverlay(newOverlay);
      seg.point.x = newLocal.x;
      seg.point.y = newLocal.y;

      if (seg.cp1 && orig.cp1) {
        const origCp1Overlay = this._toOverlay(orig.cp1);
        const newCp1Overlay: IPoint = { x: origCp1Overlay.x + dx, y: origCp1Overlay.y + dy };
        const newCp1Local = this._fromOverlay(newCp1Overlay);
        seg.cp1.x = newCp1Local.x;
        seg.cp1.y = newCp1Local.y;
      }
      if (seg.cp2 && orig.cp2) {
        const origCp2Overlay = this._toOverlay(orig.cp2);
        const newCp2Overlay: IPoint = { x: origCp2Overlay.x + dx, y: origCp2Overlay.y + dy };
        const newCp2Local = this._fromOverlay(newCp2Overlay);
        seg.cp2.x = newCp2Local.x;
        seg.cp2.y = newCp2Local.y;
      }
    }
  }

  /** Update existing overlay circle/line positions without removing/recreating them.
   *  This preserves pointer capture during drag. */
  private _updateOverlayPositions() {
    if (!this._geometry) return;

    let prevAnchor: IPoint | null = null;
    let lineIdx = 0;

    for (let i = 0; i < this._geometry.segments.length; i++) {
      const seg = this._geometry.segments[i];
      if (seg.type === SegmentType.Close) {
        prevAnchor = this._geometry.segments[0]?.point ?? null;
        continue;
      }

      if (seg.cp1) {
        const cp1Overlay = this._toOverlay(seg.cp1);
        if (prevAnchor && lineIdx < this._overlayLines.length) {
          const prevOverlay = this._toOverlay(prevAnchor);
          const line = this._overlayLines[lineIdx++];
          line.setAttribute('x1', prevOverlay.x.toString());
          line.setAttribute('y1', prevOverlay.y.toString());
          line.setAttribute('x2', cp1Overlay.x.toString());
          line.setAttribute('y2', cp1Overlay.y.toString());
        }
        if (seg.type === SegmentType.QuadraticBezier && lineIdx < this._overlayLines.length) {
          const anchorOverlay = this._toOverlay(seg.point);
          const line = this._overlayLines[lineIdx++];
          line.setAttribute('x1', anchorOverlay.x.toString());
          line.setAttribute('y1', anchorOverlay.y.toString());
          line.setAttribute('x2', cp1Overlay.x.toString());
          line.setAttribute('y2', cp1Overlay.y.toString());
        }
        const cp1Circle = this._overlayCircles.get(`cp1-${i}`);
        if (cp1Circle) {
          cp1Circle.setAttribute('cx', cp1Overlay.x.toString());
          cp1Circle.setAttribute('cy', cp1Overlay.y.toString());
        }
      }
      if (seg.cp2) {
        const cp2Overlay = this._toOverlay(seg.cp2);
        const anchorOverlay = this._toOverlay(seg.point);
        if (lineIdx < this._overlayLines.length) {
          const line = this._overlayLines[lineIdx++];
          line.setAttribute('x1', anchorOverlay.x.toString());
          line.setAttribute('y1', anchorOverlay.y.toString());
          line.setAttribute('x2', cp2Overlay.x.toString());
          line.setAttribute('y2', cp2Overlay.y.toString());
        }
        const cp2Circle = this._overlayCircles.get(`cp2-${i}`);
        if (cp2Circle) {
          cp2Circle.setAttribute('cx', cp2Overlay.x.toString());
          cp2Circle.setAttribute('cy', cp2Overlay.y.toString());
        }
      }

      if (this._shouldRenderAnchorHandle(i, seg, this._geometry)) {
        const overlayPt = this._toOverlay(seg.point);
        const anchorCircle = this._overlayCircles.get(`anchor-${i}`);
        if (anchorCircle) {
          anchorCircle.setAttribute('cx', overlayPt.x.toString());
          anchorCircle.setAttribute('cy', overlayPt.y.toString());
        }
      }

      prevAnchor = seg.point;
    }
  }

  private _onPointerUp(event: PointerEvent, segIndex: number) {
    event.stopPropagation();
    (event.target as Element).releasePointerCapture(event.pointerId);

    if (this._dragState && this._geometry) {
      // Commit via designItem for undo support (follows PathExtension pattern)
      this._commitGeometryChange();
      this._dragState = null;
    }
  }

  // -- Geometry manipulation --

  /** Set attributes directly on the DOM element for live visual feedback during drag */
  private _applyGeometryToElement() {
    if (!this._reader || !this._geometry) return;
    const attrs = this._reader.serialize(this._geometry);
    applyGeometryWritesToElement(this.extendedItem.element, attrs);
  }

  /** Commit geometry change through the designItem undo system.
   *  group.commit() will trigger refreshAllExtensions which redraws overlays. */
  private _commitGeometryChange() {
    if (!this._reader || !this._geometry) return;
    const attrs = this._reader.serialize(this._geometry);
    const group = this.extendedItem.openGroup('editGeometry');
    applyGeometryWritesToDesignItem(this.extendedItem, attrs);
    group.commit();
  }

  // -- Context menu --

  private _showContextMenu(event: MouseEvent, segIndex: number, seg: IGeometrySegment) {
    if (!this._geometry) return;
    const items: IContextMenuItem[] = [];
    const isPath = this.extendedItem.element instanceof SVGPathElement;
    const nonCloseSegments = this._geometry.segments.filter(s => s.type !== SegmentType.Close);

    // Delete point (only if not the only point)
    if (nonCloseSegments.length > 2) {
      items.push({
        title: 'Delete point', action: () => {
          if (!this._geometry) return;
          this._geometry.segments.splice(segIndex, 1);
          if (segIndex === 0 && this._geometry.segments.length > 0 && this._geometry.segments[0].type !== SegmentType.Close) {
            this._geometry.segments[0].type = SegmentType.Move;
          }
          this._applyGeometryToElement();
          this._commitGeometryChange();
        }
      });
    }

    // Insert point after
    if (isPath) {
      const nextSeg = this._findNextNonCloseSegment(segIndex);
      if (nextSeg !== null) {
        items.push({
          title: 'Insert point after', action: () => {
            this._insertPointAfter(segIndex);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      }
    }

    // Close / Open path
    if (isPath && this._geometry.segments.length > 0) {
      const hasClose = this._geometry.segments.some(s => s.type === SegmentType.Close);
      const lastNonCloseIdx = this._findLastNonCloseIndex();
      if (segIndex === lastNonCloseIdx || (hasClose && seg.type !== SegmentType.Close)) {
        items.push({ title: '---' });
        if (hasClose) {
          items.push({
            title: 'Open path', action: () => {
              if (!this._geometry) return;
              this._geometry.segments = this._geometry.segments.filter(s => s.type !== SegmentType.Close);
              this._geometry.closed = false;
              this._applyGeometryToElement();
              this._commitGeometryChange();
            }
          });
        } else {
          items.push({
            title: 'Close path', action: () => {
              if (!this._geometry) return;
              this._geometry.segments.push({ type: SegmentType.Close, relative: false, point: this._geometry.segments[0].point });
              this._geometry.closed = true;
              this._applyGeometryToElement();
              this._commitGeometryChange();
            }
          });
        }
      }
    }

    // Segment type conversion (only for path elements)
    if (isPath && segIndex > 0 && seg.type !== SegmentType.Move && seg.type !== SegmentType.Close) {
      items.push({ title: '---' });

      if (seg.type !== SegmentType.Line && seg.type !== SegmentType.HorizontalLine && seg.type !== SegmentType.VerticalLine) {
        items.push({
          title: 'Convert to line', action: () => {
            this._convertToLine(segIndex);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.QuadraticBezier) {
        items.push({
          title: 'Convert to quadratic bézier', action: () => {
            this._convertToQuadratic(segIndex);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.CubicBezier) {
        items.push({
          title: 'Convert to cubic bézier', action: () => {
            this._convertToCubic(segIndex);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.Arc) {
        items.push({
          title: 'Convert to arc', action: () => {
            this._convertToArc(segIndex, false);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
        items.push({
          title: 'Convert to inverted arc', action: () => {
            this._convertToArc(segIndex, true);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      } else {
        items.push({
          title: 'Invert arc', action: () => {
            this._invertArc(segIndex);
            this._applyGeometryToElement();
            this._commitGeometryChange();
          }
        });
      }
    }

    if (items.length > 0) {
      ContextMenu.show(items, event);
    }
  }

  private _findLastNonCloseIndex(): number {
    if (!this._geometry) return -1;
    for (let i = this._geometry.segments.length - 1; i >= 0; i--) {
      if (this._geometry.segments[i].type !== SegmentType.Close) return i;
    }
    return -1;
  }

  private _findNextNonCloseSegment(segIndex: number): number | null {
    if (!this._geometry) return null;
    for (let i = segIndex + 1; i < this._geometry.segments.length; i++) {
      if (this._geometry.segments[i].type !== SegmentType.Close) return i;
    }
    return null;
  }

  private _findPreviousAnchor(segIndex: number): IPoint | null {
    if (!this._geometry) return null;
    for (let i = segIndex - 1; i >= 0; i--) {
      const s = this._geometry.segments[i];
      if (s.type !== SegmentType.Close) return s.point;
    }
    return null;
  }

  private _insertPointAfter(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const nextIdx = this._findNextNonCloseSegment(segIndex);
    if (nextIdx === null) return;

    const nextSeg = this._geometry.segments[nextIdx];
    let newPoint: IPoint;

    switch (nextSeg.type) {
      case SegmentType.CubicBezier: {
        // Evaluate cubic bezier at t=0.5 using De Casteljau
        const p0 = seg.point;
        const p1 = <IPoint>nextSeg.cp1;
        const p2 = <IPoint>nextSeg.cp2;
        const p3 = nextSeg.point;
        newPoint = this._evalCubicBezier(p0, p1, p2, p3, 0.5);
        break;
      }
      case SegmentType.QuadraticBezier: {
        // Evaluate quadratic bezier at t=0.5
        const p0 = seg.point;
        const p1 = <IPoint>nextSeg.cp1;
        const p2 = nextSeg.point;
        newPoint = this._evalQuadraticBezier(p0, p1, p2, 0.5);
        break;
      }
      default: {
        // Linear midpoint
        newPoint = {
          x: (seg.point.x + nextSeg.point.x) / 2,
          y: (seg.point.y + nextSeg.point.y) / 2,
        };
        break;
      }
    }

    const newSeg: IGeometrySegment = {
      type: SegmentType.Line,
      relative: seg.relative,
      point: newPoint,
    };
    this._geometry.segments.splice(segIndex + 1, 0, newSeg);
  }

  private _convertToLine(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    seg.type = SegmentType.Line;
    delete seg.cp1;
    delete seg.cp2;
    delete seg.arc;
  }

  private _convertToQuadratic(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const prevPt = this._findPreviousAnchor(segIndex);
    if (!prevPt) return;

    const endPt = seg.point;
    // Generate control point perpendicular to the midpoint
    const mpx = (prevPt.x + endPt.x) / 2;
    const mpy = (prevPt.y + endPt.y) / 2;
    const dist = Math.sqrt(Math.pow(endPt.x - prevPt.x, 2) + Math.pow(endPt.y - prevPt.y, 2));
    const offset = Math.max(20, dist * 0.25);
    const theta = Math.atan2(endPt.y - prevPt.y, endPt.x - prevPt.x) - Math.PI / 2;

    seg.type = SegmentType.QuadraticBezier;
    seg.cp1 = {
      x: mpx + offset * Math.cos(theta),
      y: mpy + offset * Math.sin(theta),
    };
    delete seg.cp2;
    delete seg.arc;
  }

  private _convertToCubic(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const prevPt = this._findPreviousAnchor(segIndex);
    if (!prevPt) return;

    const endPt = seg.point;

    if (seg.type === SegmentType.QuadraticBezier && seg.cp1) {
      // Elevate quadratic to cubic: C_cp1 = P0 + 2/3*(Q_cp1 - P0), C_cp2 = P3 + 2/3*(Q_cp1 - P3)
      seg.type = SegmentType.CubicBezier;
      const qcp = seg.cp1;
      seg.cp1 = {
        x: prevPt.x + (2 / 3) * (qcp.x - prevPt.x),
        y: prevPt.y + (2 / 3) * (qcp.y - prevPt.y),
      };
      seg.cp2 = {
        x: endPt.x + (2 / 3) * (qcp.x - endPt.x),
        y: endPt.y + (2 / 3) * (qcp.y - endPt.y),
      };
    } else {
      // Generate default control points at 1/3 and 2/3 along the line
      seg.type = SegmentType.CubicBezier;
      seg.cp1 = {
        x: prevPt.x + (endPt.x - prevPt.x) / 3,
        y: prevPt.y + (endPt.y - prevPt.y) / 3,
      };
      seg.cp2 = {
        x: prevPt.x + 2 * (endPt.x - prevPt.x) / 3,
        y: prevPt.y + 2 * (endPt.y - prevPt.y) / 3,
      };
    }
    delete seg.arc;
  }

  private _convertToArc(segIndex: number, inverted: boolean = false) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const prevPt = this._findPreviousAnchor(segIndex);
    if (!prevPt) return;

    const endPt = seg.point;
    const dx = endPt.x - prevPt.x;
    const dy = endPt.y - prevPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.max(1, dist / 2);

    seg.type = SegmentType.Arc;
    seg.arc = {
      rx: radius,
      ry: radius,
      rotation: 0,
      largeArc: false,
      sweep: !inverted,
    };
    delete seg.cp1;
    delete seg.cp2;
  }

  private _invertArc(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    if (seg.type !== SegmentType.Arc || !seg.arc) return;

    seg.arc.sweep = !seg.arc.sweep;
  }

  // -- Bezier evaluation --

  private _evalCubicBezier(p0: IPoint, p1: IPoint, p2: IPoint, p3: IPoint, t: number): IPoint {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    };
  }

  private _evalQuadraticBezier(p0: IPoint, p1: IPoint, p2: IPoint, t: number): IPoint {
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    };
  }
}
