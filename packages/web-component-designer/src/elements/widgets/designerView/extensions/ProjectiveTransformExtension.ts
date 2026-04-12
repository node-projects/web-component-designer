import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { getElementSize } from '../../../helper/getBoxQuads.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

type QuadCornerIndex = 0 | 1 | 2 | 3;

export class ProjectiveTransformExtension extends AbstractExtension {
  private _outline: SVGPathElement;
  private _handles: SVGCircleElement[] = [];
  private _activeHandleIndex: QuadCornerIndex | null = null;
  private _baseTransform = '';
  private _projectiveTransform = '';
  private _targetPoints: IPoint[] = [];

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!transformedCornerPoints) {
      return;
    }

    const points = [transformedCornerPoints.p1, transformedCornerPoints.p2, transformedCornerPoints.p3, transformedCornerPoints.p4];
    if (points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      this.remove();
      return;
    }

    if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, ...points.flatMap(point => [point.x, point.y]))) {
      this._outline = this._drawTransformedRect(transformedCornerPoints, 'svg-primary-projective-outline', this._outline);
      this._outline.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
      this._outline.style.pointerEvents = 'none';

      const radius = 5 / this.designerCanvas.zoomFactor;
      for (let index = 0; index < points.length; index++) {
        const cornerIndex = index as QuadCornerIndex;
        const point = points[index];
        let handle = this._handles[index];
        if (!handle) {
          handle = this._drawCircle(point.x, point.y, radius, 'svg-primary-projective-handle');
          handle.addEventListener(EventNames.PointerDown, event => this._handlePointerEvent(cornerIndex, event));
          handle.addEventListener(EventNames.PointerMove, event => this._handlePointerEvent(cornerIndex, event));
          handle.addEventListener(EventNames.PointerUp, event => this._handlePointerEvent(cornerIndex, event));
          this._handles[index] = handle;
        } else {
          handle = this._drawCircle(point.x, point.y, radius, 'svg-primary-projective-handle', handle);
          this._handles[index] = handle;
        }
        handle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
        handle.style.cursor = 'move';
      }
    }
  }

  override dispose() {
    this._activeHandleIndex = null;
    this._restorePersistedTransform();
    this._removeAllOverlays();
  }

  private _handlePointerEvent(index: QuadCornerIndex, event: PointerEvent) {
    event.stopPropagation();
    const target = event.target as Element;

    switch (event.type) {
      case EventNames.PointerDown:
        if (!this._startDrag(index)) {
          return;
        }
        target.setPointerCapture(event.pointerId);
        this._activeHandleIndex = index;
        break;
      case EventNames.PointerMove:
        if (this._activeHandleIndex === index && event.buttons > 0) {
          const localPoint = this._getLocalPointerPoint(event);
          if (!localPoint) {
            return;
          }
          this._targetPoints[index] = localPoint;
          this._applyPreviewTransform();
        }
        break;
      case EventNames.PointerUp:
        if (this._activeHandleIndex === index) {
          const localPoint = this._getLocalPointerPoint(event);
          if (localPoint) {
            this._targetPoints[index] = localPoint;
            this._applyPreviewTransform();
          }
          target.releasePointerCapture(event.pointerId);
          this._commitTransform();
          this._activeHandleIndex = null;
        }
        break;
    }
  }

  private _startDrag(index: QuadCornerIndex) {
    const { baseTransform, projectiveTransform } = this._parseTransform(this.extendedItem.getStyleFromSheetOrLocal('transform') ?? '');
    this._baseTransform = baseTransform;
    this._projectiveTransform = projectiveTransform;

    const currentQuad = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!currentQuad) {
      return false;
    }

    const element = this.extendedItem.element as HTMLElement;
    element.style.transform = this._buildTransform(this._baseTransform, '');
    this._targetPoints = this._convertQuadToLocalPoints(currentQuad);
    if (this._targetPoints.length !== 4 || this._targetPoints.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      this._restorePersistedTransform();
      return false;
    }
    element.style.transform = this._buildTransform(this._baseTransform, this._projectiveTransform);
    return this._targetPoints[index] != null;
  }

  private _convertQuadToLocalPoints(quad: DOMQuad) {
    return [quad.p1, quad.p2, quad.p3, quad.p4].map(point => {
      const localPoint = this.extendedItem.element.convertPointFromNode({ x: point.x, y: point.y }, this.designerCanvas.canvas);
      return { x: localPoint.x, y: localPoint.y };
    });
  }

  private _getLocalPointerPoint(event: PointerEvent) {
    const element = this.extendedItem.element as HTMLElement;
    const previewTransform = element.style.transform;
    element.style.transform = this._buildTransform(this._baseTransform, '');
    const mousePoint = this.designerCanvas.getNormalizedEventCoordinates(event);
    const localPoint = element.convertPointFromNode({ x: mousePoint.x, y: mousePoint.y }, this.designerCanvas.canvas);
    element.style.transform = previewTransform;

    if (!Number.isFinite(localPoint.x) || !Number.isFinite(localPoint.y)) {
      return null;
    }

    return { x: localPoint.x, y: localPoint.y };
  }

  private _applyPreviewTransform() {
    const projectiveTransform = this._buildProjectiveTransform(this._targetPoints);
    if (projectiveTransform == null) {
      return;
    }

    this._projectiveTransform = projectiveTransform;
    (this.extendedItem.element as HTMLElement).style.transform = this._buildTransform(this._baseTransform, this._projectiveTransform);
  }

  private _commitTransform() {
    const projectiveTransform = this._buildProjectiveTransform(this._targetPoints);
    if (projectiveTransform != null) {
      this._projectiveTransform = projectiveTransform;
    }

    const finalTransform = this._buildTransform(this._baseTransform, this._projectiveTransform);
    if (finalTransform) {
      this.extendedItem.updateStyleInSheetOrLocal('transform', finalTransform);
    } else if (this.extendedItem.hasStyle('transform')) {
      this.extendedItem.removeStyle('transform');
    } else {
      this.extendedItem.updateStyleInSheetOrLocal('transform', null);
    }

    this._restorePersistedTransform();
  }

  private _restorePersistedTransform() {
    const element = this.extendedItem.element as HTMLElement;
    if (this.extendedItem.hasStyle('transform')) {
      element.style.transform = this.extendedItem.getStyle('transform') ?? '';
    } else {
      element.style.transform = '';
    }
  }

  private _buildProjectiveTransform(points: IPoint[]) {
    const size = getElementSize(this.extendedItem.element);
    if (!size.width || !size.height || points.length !== 4) {
      return '';
    }

    const sourcePoints: IPoint[] = [
      { x: 0, y: 0 },
      { x: size.width, y: 0 },
      { x: size.width, y: size.height },
      { x: 0, y: size.height }
    ];

    if (this._pointsApproximatelyEqual(points, sourcePoints)) {
      return '';
    }

    const matrix = this._createProjectiveMatrix(points, size.width, size.height);
    if (!matrix) {
      return null;
    }

    const transformOrigin = getComputedStyle(this.extendedItem.element).transformOrigin.split(' ');
    const origin = {
      x: parseFloat(transformOrigin[0]) || 0,
      y: parseFloat(transformOrigin[1]) || 0
    };
    const correctedMatrix = new DOMMatrix()
      .translate(-origin.x, -origin.y)
      .multiply(matrix)
      .multiply(new DOMMatrix().translate(origin.x, origin.y));

    return this._serializeMatrix3d(correctedMatrix);
  }

  private _createProjectiveMatrix(points: IPoint[], width: number, height: number) {
    const [p1, p2, p3, p4] = points;

    const dx1 = p2.x - p3.x;
    const dx2 = p4.x - p3.x;
    const dx3 = p1.x - p2.x + p3.x - p4.x;
    const dy1 = p2.y - p3.y;
    const dy2 = p4.y - p3.y;
    const dy3 = p1.y - p2.y + p3.y - p4.y;

    let aUnit: number;
    let bUnit: number;
    let dUnit: number;
    let eUnit: number;
    let gUnit: number;
    let hUnit: number;

    if (Math.abs(dx3) < 1e-8 && Math.abs(dy3) < 1e-8) {
      aUnit = p2.x - p1.x;
      bUnit = p4.x - p1.x;
      dUnit = p2.y - p1.y;
      eUnit = p4.y - p1.y;
      gUnit = 0;
      hUnit = 0;
    } else {
      const determinant = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(determinant) < 1e-8) {
        return null;
      }

      gUnit = (dx3 * dy2 - dx2 * dy3) / determinant;
      hUnit = (dx1 * dy3 - dx3 * dy1) / determinant;
      aUnit = p2.x - p1.x + gUnit * p2.x;
      bUnit = p4.x - p1.x + hUnit * p4.x;
      dUnit = p2.y - p1.y + gUnit * p2.y;
      eUnit = p4.y - p1.y + hUnit * p4.y;
    }

    const matrix = new DOMMatrix([
      aUnit / width, dUnit / width, 0, gUnit / width,
      bUnit / height, eUnit / height, 0, hUnit / height,
      0, 0, 1, 0,
      p1.x, p1.y, 0, 1
    ]);

    const values = [
      matrix.m11, matrix.m12, matrix.m13, matrix.m14,
      matrix.m21, matrix.m22, matrix.m23, matrix.m24,
      matrix.m31, matrix.m32, matrix.m33, matrix.m34,
      matrix.m41, matrix.m42, matrix.m43, matrix.m44
    ];
    if (values.some(value => !Number.isFinite(value))) {
      return null;
    }

    return matrix;
  }

  private _serializeMatrix3d(matrix: DOMMatrix) {
    const values = [
      matrix.m11, matrix.m12, matrix.m13, matrix.m14,
      matrix.m21, matrix.m22, matrix.m23, matrix.m24,
      matrix.m31, matrix.m32, matrix.m33, matrix.m34,
      matrix.m41, matrix.m42, matrix.m43, matrix.m44
    ].map(value => this._formatMatrixNumber(value));

    return `matrix3d(${values.join(', ')})`;
  }

  private _formatMatrixNumber(value: number) {
    if (Math.abs(value) < 1e-10) {
      return '0';
    }

    let rounded = value.toFixed(8);
    if (rounded.includes('.')) {
      rounded = rounded.replace(/0+$/, '').replace(/\.$/, '');
    }
    return rounded === '-0' ? '0' : rounded;
  }

  private _buildTransform(baseTransform: string, projectiveTransform: string) {
    const transforms: string[] = [];
    if (baseTransform?.trim()) {
      transforms.push(baseTransform.trim());
    }
    if (projectiveTransform?.trim()) {
      transforms.push(projectiveTransform.trim());
    }
    return transforms.join(' ').trim();
  }

  private _parseTransform(transform: string) {
    if (!transform || transform === 'none') {
      return { baseTransform: '', projectiveTransform: '' };
    }

    const parts = this._splitTransformFunctions(transform);
    if (!parts.length) {
      return { baseTransform: transform.trim(), projectiveTransform: '' };
    }

    const lastPart = parts[parts.length - 1];
    const functionName = lastPart.slice(0, lastPart.indexOf('(')).trim().toLowerCase();
    if (functionName === 'matrix' || functionName === 'matrix3d') {
      return {
        baseTransform: parts.slice(0, -1).join(' ').trim(),
        projectiveTransform: lastPart.trim()
      };
    }

    return { baseTransform: transform.trim(), projectiveTransform: '' };
  }

  private _splitTransformFunctions(transform: string) {
    const parts: string[] = [];
    let startIndex = -1;
    let depth = 0;

    for (let index = 0; index < transform.length; index++) {
      const character = transform[index];
      if (character === '(') {
        depth++;
      } else if (character === ')') {
        depth--;
        if (depth === 0 && startIndex !== -1) {
          parts.push(transform.slice(startIndex, index + 1).trim());
          startIndex = -1;
        }
      } else if (depth === 0 && startIndex === -1 && character.trim()) {
        startIndex = index;
      }
    }

    if (!parts.length && transform.trim()) {
      parts.push(transform.trim());
    }
    return parts;
  }

  private _pointsApproximatelyEqual(pointsA: IPoint[], pointsB: IPoint[]) {
    if (pointsA.length !== pointsB.length) {
      return false;
    }

    return pointsA.every((point, index) => {
      const compareTo = pointsB[index];
      return Math.abs(point.x - compareTo.x) < 0.01 && Math.abs(point.y - compareTo.y) < 0.01;
    });
  }
}