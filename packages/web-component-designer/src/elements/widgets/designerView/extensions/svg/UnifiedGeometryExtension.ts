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
import { fromOverlayPointToSvgUserSpace, toOverlayPointFromSvgUserSpace } from '../../../../helper/SvgHelper.js';
import { ISourcePart, ISvgPathHandleSourcePartData } from '../../../../services/sourceMapService/ISourcePart.js';
import { createSvgPathHandleSourcePartKey } from '../../../../services/sourceMapService/SvgPathSourceMapProvider.js';
import { SvgPointSnapping } from './SvgPointSnapping.js';

interface DragState {
  startCursorPos: IPoint;
  currentCursorPos: IPoint;
  segmentIndex: number;
  handleType: 'anchor' | 'cp1' | 'cp2';
  originalPoint: IPoint;
  originalSegments: { point: IPoint; cp1?: IPoint; cp2?: IPoint }[];
  startScrollOffset: IPoint;
  geometryChanged: boolean;
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
  private _snapping: SvgPointSnapping;
  private _originalGeometry: IGeometry;
  private _restorePreview?: () => void;
  private _selectedIndex = 0;
  private _selectedHandleType: 'anchor' | 'cp1' | 'cp2' = 'anchor';
  private _commandHandler = (event: CustomEvent) => this._executeCommand(event.detail);
  private _keyHandler = (event: KeyboardEvent) => {
    if (event.composedPath().some(node => node instanceof HTMLElement && (node.hasAttribute('data-svg-toolbar') || node.matches('input,textarea,select,[contenteditable=true]')))) return;
    if (this._dragState && ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      this._updateDrag(this._dragState.currentCursorPos, event);
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (event.type !== 'keydown') return;
    if (event.key === 'Escape' && this._dragState) {
      this._cancelDrag();
      event.preventDefault();
      event.stopImmediatePropagation();
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && this.extendedItem.element instanceof SVGPathElement) {
      this._executeCommand({ command: 'delete', index: this._selectedIndex });
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, reader?: IGeometryReader, options?: UnifiedGeometryExtensionOptions) {
    super(extensionManager, designerView, extendedItem);
    this._reader = reader ?? getGeometryReader(extendedItem.element);
    this._options = options ?? {};
  }

  override extend() {
    this.extendedItem.element.addEventListener('svg-geometry-command', this._commandHandler);
    this.designerCanvas.clickOverlay.addEventListener('keydown', this._keyHandler, true);
    this.designerCanvas.clickOverlay.addEventListener('keyup', this._keyHandler, true);
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
    this._cancelDrag();
    this.extendedItem.element.removeEventListener('svg-geometry-command', this._commandHandler);
    this.designerCanvas.clickOverlay.removeEventListener('keydown', this._keyHandler, true);
    this.designerCanvas.clickOverlay.removeEventListener('keyup', this._keyHandler, true);
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
      this._overlayStructureSignature ?? '',
      this._getSelectedHandleRefreshKey()
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

  private _getSelectedHandleRefreshKey(): string {
    const selectedPart = this.extendedItem.instanceServiceContainer.selectionService.selectedPart;
    const data = selectedPart?.data as ISvgPathHandleSourcePartData;
    if (selectedPart?.designItem !== this.extendedItem || selectedPart.kind !== 'svg-path-handle') {
      return `selected:${this._selectedIndex}:${this._selectedHandleType}`;
    }
    return `selected:${data?.segmentIndex}:${data?.handleType}`;
  }

  /** Convert an SVG user-space coordinate to overlay (canvas) coordinates. */
  private _toOverlay(p: IPoint): IPoint {
    return toOverlayPointFromSvgUserSpace(this.extendedItem.element, this.designerCanvas, p);
  }

  /** Convert overlay (canvas) coordinates back to SVG user-space. */
  private _fromOverlay(p: IPoint): IPoint {
    return fromOverlayPointToSvgUserSpace(this.extendedItem.element, this.designerCanvas, p);
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
      circle.classList.toggle('svg-path-selected-part', this._isSelectedHandle(key));
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
    this._addTrackedListener(circle, 'pointercancel', () => this._cancelDrag());
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
    this._addTrackedListener(circle, 'pointercancel', () => this._cancelDrag());
  }

  // -- Pointer event handlers --

  private _onPointerDown(event: PointerEvent, circle: SVGCircleElement, segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2') {
    event.stopPropagation();
    event.preventDefault();
    this.designerCanvas.clickOverlay.focus();
    this._selectSourcePart(segIndex, handleType, event);
    (event.target as Element).setPointerCapture(event.pointerId);
    const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

    if (!this._geometry) return;

    this._originalGeometry = structuredClone(this._geometry);
    const element = this.extendedItem.element as HTMLElement;
    const originals = this._reader.serialize(this._geometry).map(write => ({
      ...write, value: write.target === 'style' ? element.style.getPropertyValue(write.attribute) : element.getAttribute(write.attribute),
      priority: write.target === 'style' ? element.style.getPropertyPriority(write.attribute) : ''
    }));
    this._restorePreview = () => {
      for (const write of originals) {
        if (write.target === 'style') {
          if (write.value) element.style.setProperty(write.attribute, write.value, write.priority);
          else element.style.removeProperty(write.attribute);
        } else if (write.value === null) element.removeAttribute(write.attribute);
        else element.setAttribute(write.attribute, write.value);
      }
    };
    this._snapping?.clear();
    this._snapping = new SvgPointSnapping(this.designerCanvas, this.extendedItem.element);

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
      currentCursorPos: cursorPos,
      segmentIndex: segIndex,
      handleType,
      originalPoint,
      originalSegments,
      startScrollOffset: this.designerCanvas.canvasOffset,
      geometryChanged: false,
    };
  }

  private _selectSourcePart(segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2', event: Event) {
    this._selectedIndex = segIndex;
    this._selectedHandleType = handleType;
    const selectionService = this.extendedItem.instanceServiceContainer.selectionService;
    const sourcePart = this._getSourcePart(segIndex, handleType);
    if (selectionService.primarySelection !== this.extendedItem)
      selectionService.setSelectedElements([this.extendedItem], event, sourcePart);

    else if (sourcePart)
      selectionService.setSelectedPart(sourcePart, event);
    this._updateOverlayAppearance();
    this.extendedItem.element.dispatchEvent(new CustomEvent('svg-handle-selected', { detail: { index: segIndex, handleType } }));
  }

  private _getSourcePart(segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2'): ISourcePart<ISvgPathHandleSourcePartData> {
    const key = createSvgPathHandleSourcePartKey(segIndex, handleType);
    return this.extendedItem.instanceServiceContainer.designItemDocumentPositionService
      ?.getSourceParts(this.extendedItem)
      .find(x => x.key === key) as ISourcePart<ISvgPathHandleSourcePartData>;
  }

  private _isSelectedHandle(circleKey: string) {
    const [handleType, segmentIndexText] = circleKey.split('-') as ['anchor' | 'cp1' | 'cp2', string];
    const selectedPart = this.extendedItem.instanceServiceContainer.selectionService.selectedPart;
    const data = selectedPart?.data as ISvgPathHandleSourcePartData;
    if (!selectedPart || selectedPart.kind !== 'svg-path-handle') return Number(segmentIndexText) === this._selectedIndex && handleType === this._selectedHandleType;
    return selectedPart?.designItem === this.extendedItem
      && selectedPart.kind === 'svg-path-handle'
      && data?.segmentIndex === Number(segmentIndexText)
      && data?.handleType === handleType;
  }

  private _onPointerMove(event: PointerEvent, circle: SVGCircleElement, segIndex: number, handleType: 'anchor' | 'cp1' | 'cp2') {
    event.stopPropagation();
    event.preventDefault();
    if (!this._dragState || !this._geometry || event.buttons === 0) return;
    if (this._dragState.segmentIndex !== segIndex || this._dragState.handleType !== handleType) return;

    this._dragState.currentCursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);
    this._updateDrag(this._dragState.currentCursorPos, event);
  }

  private _updateDrag(cursorPos: IPoint, event: Pick<KeyboardEvent, 'shiftKey' | 'altKey' | 'ctrlKey'>) {
    if (!this._dragState) return;
    const { segmentIndex: segIndex, handleType } = this._dragState;
    let dx = cursorPos.x - this._dragState.startCursorPos.x;
    let dy = cursorPos.y - this._dragState.startCursorPos.y;
    // Recompute every preview from the same snapshot, including releasing a modifier
    // or returning to the original point after moving other anchors with Ctrl+Alt.
    this._geometry = structuredClone(this._originalGeometry);
    // Shift key: constrain to axis
    if (event.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }
    const original = this._toOverlay(this._dragState.originalPoint);
    const references = this._dragState.originalSegments.filter((_, index) => index !== segIndex).map(segment => this._toOverlay(segment.point));
    for (let i = 1; i < this._dragState.originalSegments.length; i++) {
      const edge = this._dragState.originalSegments[i];
      if (i === segIndex || i - 1 === segIndex || ![SegmentType.Line, SegmentType.HorizontalLine, SegmentType.VerticalLine].includes(this._originalGeometry.segments[i].type)) continue;
      const previous = this._dragState.originalSegments[i - 1].point;
      references.push(this._toOverlay({ x: (previous.x + edge.point.x) / 2, y: (previous.y + edge.point.y) / 2 }));
    }
    if (references.length > 1) references.push({
      x: (Math.min(...references.map(p => p.x)) + Math.max(...references.map(p => p.x))) / 2,
      y: (Math.min(...references.map(p => p.y)) + Math.max(...references.map(p => p.y))) / 2
    });
    const snapped = this._snapping.snap({ x: original.x + dx, y: original.y + dy }, references, event.altKey, {
      x: !(event.shiftKey && dx === 0) && this._geometry.segments[segIndex].type !== SegmentType.VerticalLine,
      y: !(event.shiftKey && dy === 0) && this._geometry.segments[segIndex].type !== SegmentType.HorizontalLine
    });
    dx = snapped.x - original.x;
    dy = snapped.y - original.y;

    if (dx === 0 && dy === 0 && !this._dragState.geometryChanged) return;

    // Ctrl+Alt + anchor drag: move entire shape
    if (event.ctrlKey && event.altKey && handleType === 'anchor' && this._options.allowShapeDrag !== false) {
      this._dragWholeShape(dx, dy);
    } else {
      this._dragSingleHandle(segIndex, handleType, dx, dy);
    }
    if (handleType === 'anchor') {
      this._normalizeAxisLineSegments();
    }
    this._dragState.geometryChanged = true;

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
      if (seg.type === SegmentType.HorizontalLine) {
        const prevPt = this._findPreviousAnchor(segIndex);
        seg.point.x = newLocal.x;
        seg.point.y = prevPt?.y ?? seg.point.y;
      } else if (seg.type === SegmentType.VerticalLine) {
        const prevPt = this._findPreviousAnchor(segIndex);
        seg.point.x = prevPt?.x ?? seg.point.x;
        seg.point.y = newLocal.y;
      } else {
        seg.point.x = newLocal.x;
        seg.point.y = newLocal.y;
      }
      const original = this._dragState!.originalSegments[segIndex];
      const anchorDx = seg.point.x - original.point.x, anchorDy = seg.point.y - original.point.y;
      if (seg.cp2 && original.cp2) seg.cp2 = { x: original.cp2.x + anchorDx, y: original.cp2.y + anchorDy };
      const nextIndex = this._findNextNonCloseSegment(segIndex);
      if (nextIndex !== null) {
        const next = this._geometry!.segments[nextIndex];
        const nextOriginal = this._dragState!.originalSegments[nextIndex];
        if (next.cp1 && nextOriginal.cp1) next.cp1 = { x: nextOriginal.cp1.x + anchorDx, y: nextOriginal.cp1.y + anchorDy };
      }
    } else if (handleType === 'cp1') {
      seg.cp1!.x = newLocal.x;
      seg.cp1!.y = newLocal.y;
    } else {
      seg.cp2!.x = newLocal.x;
      seg.cp2!.y = newLocal.y;
    }
  }

  private _normalizeAxisLineSegments() {
    if (!this._geometry) return;

    let prevAnchor: IPoint | null = null;
    const firstAnchor = this._geometry.segments.find(s => s.type !== SegmentType.Close)?.point;

    for (const seg of this._geometry.segments) {
      if (seg.type === SegmentType.Close) {
        if (firstAnchor) {
          seg.point = { ...firstAnchor };
        }
        continue;
      }

      if (prevAnchor) {
        if (seg.type === SegmentType.HorizontalLine) {
          seg.point.y = prevAnchor.y;
        } else if (seg.type === SegmentType.VerticalLine) {
          seg.point.x = prevAnchor.x;
        }
      }

      prevAnchor = seg.point;
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

    const changed = this._dragState?.geometryChanged;
    this._dragState = null;
    this._snapping?.clear();
    if (changed && this._geometry) {
      this._restorePreview?.();
      // Commit via designItem for undo support (follows PathExtension pattern)
      this._commitGeometryChange();
    }
    this._restorePreview = undefined;
  }

  private _cancelDrag() {
    if (this._dragState && this._originalGeometry) {
      this._geometry = this._originalGeometry;
      this._restorePreview?.();
      this._updateOverlayPositions();
    }
    this._dragState = null;
    this._restorePreview = undefined;
    this._snapping?.clear();
  }

  private _executeCommand(detail: { command: string, index: number, handleType?: 'anchor' | 'cp1' | 'cp2', axis?: 'x' | 'y', value?: number }) {
    if (!this._geometry) return;
    const index = detail.index;
    const segment = this._geometry.segments[index];
    if (!segment || segment.type === SegmentType.Close) return;
    let start = index, end = index + 1;
    while (start > 0 && this._geometry.segments[start].type !== SegmentType.Move) start--;
    while (end < this._geometry.segments.length && this._geometry.segments[end].type !== SegmentType.Move) end++;
    const closed = this._geometry.segments[end - 1].type === SegmentType.Close;
    const count = end - start - (closed ? 1 : 0);
    if (detail.command === 'select') {
      this._selectSourcePart(index, detail.handleType ?? 'anchor', new Event('svg-node-selection'));
      this._updateOverlayAppearance();
      return;
    }
    if (detail.command === 'delete' && count > 2) {
      this._geometry.segments.splice(index, 1);
      if (index === start) this._convertToMove(start);
    } else if (detail.command === 'insert') this._insertPointAfter(index);
    else if (detail.command === 'close' && count >= 3) {
      if (closed) this._geometry.segments.splice(end - 1, 1);
      else this._geometry.segments.splice(end, 0, { type: SegmentType.Close, relative: false, point: { ...this._geometry.segments[start].point } });
      this._geometry.closed = this._geometry.segments.some(segment => segment.type === SegmentType.Close);
    } else if (detail.command === 'coordinate' && detail.axis && Number.isFinite(detail.value)) {
      const point = detail.handleType && detail.handleType !== 'anchor' ? segment[detail.handleType] : segment.point;
      if (!point) return;
      const diff = detail.value - point[detail.axis];
      point[detail.axis] = detail.value;
      if (!detail.handleType || detail.handleType === 'anchor') {
        if (segment.cp2) segment.cp2[detail.axis] += diff;
        const next = this._findNextNonCloseSegment(index);
        if (next !== null && this._geometry.segments[next].cp1) this._geometry.segments[next].cp1[detail.axis] += diff;
      }
    } else if (index > 0) {
      if (detail.command === 'L') this._convertToLine(index);
      else if (detail.command === 'H') this._convertToHorizontalLine(index);
      else if (detail.command === 'V') this._convertToVerticalLine(index);
      else if (detail.command === 'Q') this._convertToQuadratic(index);
      else if (detail.command === 'C') this._convertToCubic(index);
      else if (detail.command === 'A') this._convertToArc(index, false);
      else return;
    } else return;
    this._normalizeAxisLineSegments();
    this._commitGeometryChange();
    this.refresh();
  }

  // -- Geometry manipulation --

  /** Set attributes directly on the DOM element for live visual feedback during drag */
  private _applyGeometryToElement() {
    if (!this._reader || !this._geometry) return;
    const attrs = this._reader.serialize(this._geometry);
    applyGeometryWritesToElement(this.extendedItem.element, attrs, this.extendedItem.serviceContainer.options.roundPixelsToDecimalPlaces);
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

    if (isPath) {
      items.push({ title: 'Delete point', action: () => this._executeCommand({ command: 'delete', index: segIndex }) });
      const next = this._findNextNonCloseSegment(segIndex);
      if (next !== null && [SegmentType.Line, SegmentType.HorizontalLine, SegmentType.VerticalLine, SegmentType.CubicBezier, SegmentType.QuadraticBezier].includes(this._geometry.segments[next].type))
        items.push({ title: 'Insert point after', action: () => this._executeCommand({ command: 'insert', index: segIndex }) });
      items.push({ title: 'Open / close subpath', action: () => this._executeCommand({ command: 'close', index: segIndex }) });
    }

    // Segment type conversion (only for path elements)
    if (isPath && segIndex > 0 && seg.type !== SegmentType.Close) {
      items.push({ title: '---' });
      const conversionItems: IContextMenuItem[] = [];

      if (seg.type !== SegmentType.Move) {
        conversionItems.push({
          title: 'moveto', action: () => {
            this._convertToMove(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.Line && seg.type !== SegmentType.HorizontalLine && seg.type !== SegmentType.VerticalLine) {
        conversionItems.push({
          title: 'line', action: () => {
            this._convertToLine(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.HorizontalLine) {
        conversionItems.push({
          title: 'horizontal line', action: () => {
            this._convertToHorizontalLine(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.VerticalLine) {
        conversionItems.push({
          title: 'vertical line', action: () => {
            this._convertToVerticalLine(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.QuadraticBezier) {
        conversionItems.push({
          title: 'quadratic bÃ©zier', action: () => {
            this._convertToQuadratic(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.CubicBezier) {
        conversionItems.push({
          title: 'cubic bÃ©zier', action: () => {
            this._convertToCubic(segIndex);
            this._commitGeometryChange();
          }
        });
      }

      if (seg.type !== SegmentType.Arc) {
        conversionItems.push({
          title: 'arc', action: () => {
            this._convertToArc(segIndex, false);
            this._commitGeometryChange();
          }
        });
        conversionItems.push({
          title: 'inverted arc', action: () => {
            this._convertToArc(segIndex, true);
            this._commitGeometryChange();
          }
        });
      }

      if (conversionItems.length > 0) {
        items.push({ title: 'Convert to', children: conversionItems });
      }

      if (seg.type === SegmentType.Arc) {
        items.push({
          title: 'Invert arc', action: () => {
            this._invertArc(segIndex);
            this._commitGeometryChange();
          }
        });
      }
    }

    if (items.length > 0) {
      ContextMenu.show(items, event);
    }
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
    if (![SegmentType.Line, SegmentType.HorizontalLine, SegmentType.VerticalLine, SegmentType.CubicBezier, SegmentType.QuadraticBezier].includes(nextSeg.type)) return;
    const middle = (a: IPoint, b: IPoint): IPoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const newSeg: IGeometrySegment = { type: nextSeg.type, relative: false, point: middle(seg.point, nextSeg.point) };
    if (nextSeg.type === SegmentType.CubicBezier) {
      const a = middle(seg.point, nextSeg.cp1!), b = middle(nextSeg.cp1!, nextSeg.cp2!), c = middle(nextSeg.cp2!, nextSeg.point);
      const d = middle(a, b), e = middle(b, c);
      newSeg.point = middle(d, e);
      newSeg.cp1 = a;
      newSeg.cp2 = d;
      nextSeg.cp1 = e;
      nextSeg.cp2 = c;
    } else if (nextSeg.type === SegmentType.QuadraticBezier) {
      const a = middle(seg.point, nextSeg.cp1!), b = middle(nextSeg.cp1!, nextSeg.point);
      newSeg.point = middle(a, b);
      newSeg.cp1 = a;
      nextSeg.cp1 = b;
    }
    this._geometry.segments.splice(segIndex + 1, 0, newSeg);
  }

  private _convertToMove(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    seg.type = SegmentType.Move;
    delete seg.cp1;
    delete seg.cp2;
    delete seg.arc;
  }

  private _convertToLine(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    seg.type = SegmentType.Line;
    delete seg.cp1;
    delete seg.cp2;
    delete seg.arc;
  }

  private _convertToHorizontalLine(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const prevPt = this._findPreviousAnchor(segIndex);
    if (!prevPt) return;

    seg.type = SegmentType.HorizontalLine;
    seg.point.y = prevPt.y;
    delete seg.cp1;
    delete seg.cp2;
    delete seg.arc;
  }

  private _convertToVerticalLine(segIndex: number) {
    if (!this._geometry) return;
    const seg = this._geometry.segments[segIndex];
    const prevPt = this._findPreviousAnchor(segIndex);
    if (!prevPt) return;

    seg.type = SegmentType.VerticalLine;
    seg.point.x = prevPt.x;
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




}
