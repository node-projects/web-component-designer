import { IPoint } from '../../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../../helper/KeyboardHelper.js';
import { roundValue } from '../../../../helper/LayoutHelper.js';
import { getElementSize } from '../../../../helper/getBoxQuads.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { getEdgeOffsetPoint, getQuadCenter } from '../../../../helper/QuadEdgeHandleHelper.js';

type SkewAxis = 'x' | 'y';

export class SkewExtension extends AbstractExtension {
  private _skewXLine?: SVGLineElement;
  private _skewYLine?: SVGLineElement;
  private _skewXCircle?: SVGCircleElement;
  private _skewYCircle?: SVGCircleElement;
  private _skewXReferencePoint: IPoint = { x: 0, y: 0 };
  private _skewYReferencePoint: IPoint = { x: 0, y: 0 };
  private _activeAxis: SkewAxis | null = null;
  private _baseTransform = '';
  private _skewX = 0;
  private _skewY = 0;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const quad = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!quad) {
      return;
    }

    const points = [quad.p1, quad.p2, quad.p3, quad.p4];
    if (points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      this.remove();
      return;
    }

    const zoomFactor = this.designerCanvas.zoomFactor;

    if (!this._valuesHaveChanges(zoomFactor, ...points.flatMap(point => [point.x, point.y]))) {
      return;
    }

    const quadCenter = getQuadCenter(quad);
    const skewXHandleCanvas = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 56 / zoomFactor, { x: 0, y: -1 });
    const skewXLineStartCanvas = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 48 / zoomFactor, { x: 0, y: -1 });
    const skewXLineEndCanvas = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 38 / zoomFactor, { x: 0, y: -1 });

    const skewYHandleCanvas = getEdgeOffsetPoint(quad.p2, quad.p3, quadCenter, 30 / zoomFactor, { x: 1, y: 0 });
    const skewYLineStartCanvas = getEdgeOffsetPoint(quad.p2, quad.p3, quadCenter, 22 / zoomFactor, { x: 1, y: 0 });
    const skewYLineEndCanvas = getEdgeOffsetPoint(quad.p2, quad.p3, quadCenter, 6 / zoomFactor, { x: 1, y: 0 });

    this._skewXLine = this._drawLine(skewXLineStartCanvas.x, skewXLineStartCanvas.y, skewXLineEndCanvas.x, skewXLineEndCanvas.y, 'svg-primary-skew-line', this._skewXLine);
    this._skewYLine = this._drawLine(skewYLineStartCanvas.x, skewYLineStartCanvas.y, skewYLineEndCanvas.x, skewYLineEndCanvas.y, 'svg-primary-skew-line', this._skewYLine);
    this._skewXLine.style.strokeWidth = (1 / zoomFactor).toString();
    this._skewYLine.style.strokeWidth = (1 / zoomFactor).toString();

    if (!this._skewXCircle) {
      this._skewXCircle = this._drawCircle(skewXHandleCanvas.x, skewXHandleCanvas.y, 5 / zoomFactor, 'svg-primary-skew', this._skewXCircle);
      this._skewXCircle.addEventListener('pointerdown', event => this._handlePointerEvent('x', event));
      this._skewXCircle.addEventListener('pointermove', event => this._handlePointerEvent('x', event));
      this._skewXCircle.addEventListener('pointerup', event => this._handlePointerEvent('x', event));
    } else {
      this._skewXCircle = this._drawCircle(skewXHandleCanvas.x, skewXHandleCanvas.y, 5 / zoomFactor, 'svg-primary-skew', this._skewXCircle);
    }
    this._skewXCircle.style.strokeWidth = (1 / zoomFactor).toString();
    this._skewXCircle.style.cursor = 'ew-resize';

    if (!this._skewYCircle) {
      this._skewYCircle = this._drawCircle(skewYHandleCanvas.x, skewYHandleCanvas.y, 5 / zoomFactor, 'svg-primary-skew', this._skewYCircle);
      this._skewYCircle.addEventListener('pointerdown', event => this._handlePointerEvent('y', event));
      this._skewYCircle.addEventListener('pointermove', event => this._handlePointerEvent('y', event));
      this._skewYCircle.addEventListener('pointerup', event => this._handlePointerEvent('y', event));
    } else {
      this._skewYCircle = this._drawCircle(skewYHandleCanvas.x, skewYHandleCanvas.y, 5 / zoomFactor, 'svg-primary-skew', this._skewYCircle);
    }
    this._skewYCircle.style.strokeWidth = (1 / zoomFactor).toString();
    this._skewYCircle.style.cursor = 'ns-resize';
    this._skewYCircle.style.fill = '#eaf5ff';
  }

  private _handlePointerEvent(axis: SkewAxis, event: PointerEvent) {
    event.stopPropagation();
    const target = event.target as Element;

    switch (event.type) {
      case 'pointerdown':
        target.setPointerCapture(event.pointerId);
        this._readPersistedTransform();
        if (axis === 'x') {
          this._skewXReferencePoint = this._getSkewReferencePoint('x');
        } else {
          this._skewYReferencePoint = this._getSkewReferencePoint('y');
        }
        this._activeAxis = axis;
        break;
      case 'pointermove':
        if (this._activeAxis === axis && event.buttons > 0) {
          const angle = this._getSkewAngle(axis, event);
          if (axis === 'x') {
            this._skewX = angle;
          } else {
            this._skewY = angle;
          }
          this._setPreviewTransform();
        }
        break;
      case 'pointerup':
        if (this._activeAxis === axis) {
          target.releasePointerCapture(event.pointerId);
          const angle = this._getSkewAngle(axis, event);
          if (axis === 'x') {
            this._skewX = angle;
          } else {
            this._skewY = angle;
          }
          this._commitTransform();
          this._activeAxis = null;
        }
        break;
    }
  }

  private _readPersistedTransform() {
    const { baseTransform, skewX, skewY } = this._parseTransform(this.extendedItem.getStyleFromSheetOrLocal('transform') ?? '');
    this._baseTransform = baseTransform;
    this._skewX = skewX;
    this._skewY = skewY;
  }

  private _getSkewReferencePoint(axis: SkewAxis) {
    const element = this.extendedItem.element as HTMLElement;
    const size = getElementSize(this.extendedItem.element);
    const zoomFactor = this.designerCanvas.zoomFactor;
    const fallback = axis === 'x'
      ? { x: size.width / 2, y: -56 / zoomFactor }
      : { x: size.width + 30 / zoomFactor, y: size.height / 2 };
    const inlineTransform = element.style.transform;

    try {
      element.style.transform = this._buildTransform(this._baseTransform, axis === 'x' ? 0 : this._skewX, axis === 'y' ? 0 : this._skewY);
      const quad = element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
      if (!quad) {
        return fallback;
      }

      const quadCenter = getQuadCenter(quad);
      const handlePoint = axis === 'x'
        ? getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 56 / zoomFactor, { x: 0, y: -1 })
        : getEdgeOffsetPoint(quad.p2, quad.p3, quadCenter, 30 / zoomFactor, { x: 1, y: 0 });
      const localPoint = element.convertPointFromNode(handlePoint, this.designerCanvas.canvas);
      if (!Number.isFinite(localPoint.x) || !Number.isFinite(localPoint.y)) {
        return fallback;
      }
      return { x: localPoint.x, y: localPoint.y };
    } finally {
      element.style.transform = inlineTransform;
    }
  }

  private _setPreviewTransform() {
    (this.extendedItem.element as HTMLElement).style.transform = this._buildTransform(this._baseTransform, this._skewX, this._skewY);
  }

  private _commitTransform() {
    const finalTransform = this._buildTransform(this._baseTransform, this._skewX, this._skewY);
    if (finalTransform) {
      this.extendedItem.updateStyleInSheetOrLocal('transform', finalTransform);
    } else if (this.extendedItem.hasStyle('transform')) {
      this.extendedItem.removeStyle('transform');
    } else {
      this.extendedItem.updateStyleInSheetOrLocal('transform', null);
    }

    const element = this.extendedItem.element as HTMLElement;
    if (this.extendedItem.hasStyle('transform')) {
      element.style.transform = this.extendedItem.getStyle('transform') ?? '';
    } else {
      element.style.transform = '';
    }
  }

  private _getSkewAngle(axis: SkewAxis, event: PointerEvent) {
    const element = this.extendedItem.element as HTMLElement;
    element.style.transform = this._buildTransform(this._baseTransform, axis === 'x' ? 0 : this._skewX, axis === 'y' ? 0 : this._skewY);

    const mousePoint = this.designerCanvas.getNormalizedEventCoordinates(event);
    const localPoint = element.convertPointFromNode({ x: mousePoint.x, y: mousePoint.y }, this.designerCanvas.canvas);

    const computedStyle = getComputedStyle(element);
    const transformOrigin = computedStyle.transformOrigin.split(' ');
    const origin = { x: parseFloat(transformOrigin[0]), y: parseFloat(transformOrigin[1]) };
    const size = getElementSize(element);

    let angle: number;
    if (axis === 'x') {
      let referenceY = this._skewXReferencePoint.y - origin.y;
      if (Math.abs(referenceY) < 0.5) {
        referenceY = -Math.max(size.height / 2, 1);
      }
      angle = Math.atan((localPoint.x - origin.x) / referenceY) * 180 / Math.PI;
    } else {
      let referenceX = this._skewYReferencePoint.x - origin.x;
      if (Math.abs(referenceX) < 0.5) {
        referenceX = Math.max(size.width / 2, 1);
      }
      angle = Math.atan((localPoint.y - origin.y) / referenceX) * 180 / Math.PI;
    }

    angle = Math.max(-80, Math.min(80, angle));
    if (!hasCommandKey(event)) {
      angle = Math.round(angle / 15) * 15;
    }
    return parseFloat(roundValue(this.extendedItem, angle));
  }

  private _buildTransform(baseTransform: string, skewX: number, skewY: number) {
    const transforms: string[] = [];
    if (baseTransform?.trim()) {
      transforms.push(baseTransform.trim());
    }
    if (Math.abs(skewX) > 0.001) {
      transforms.push(`skewX(${skewX}deg)`);
    }
    if (Math.abs(skewY) > 0.001) {
      transforms.push(`skewY(${skewY}deg)`);
    }
    return transforms.join(' ').trim();
  }

  private _parseTransform(transform: string) {
    if (!transform || transform === 'none') {
      return { baseTransform: '', skewX: 0, skewY: 0 };
    }

    let skewX = 0;
    let skewY = 0;
    const baseTransforms: string[] = [];

    for (const part of this._splitTransformFunctions(transform)) {
      const functionName = part.slice(0, part.indexOf('(')).trim().toLowerCase();
      const argumentsText = part.slice(part.indexOf('(') + 1, -1);
      const argumentsList = argumentsText.split(',').map(value => value.trim());

      if (functionName === 'skewx') {
        skewX = this._parseAngle(argumentsList[0]);
      } else if (functionName === 'skewy') {
        skewY = this._parseAngle(argumentsList[0]);
      } else if (functionName === 'skew') {
        skewX = this._parseAngle(argumentsList[0]);
        if (argumentsList.length > 1) {
          skewY = this._parseAngle(argumentsList[1]);
        }
      } else {
        baseTransforms.push(part);
      }
    }

    return { baseTransform: baseTransforms.join(' ').trim(), skewX, skewY };
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

  private _parseAngle(value: string) {
    if (!value) {
      return 0;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return 0;
    }
    if (value.endsWith('rad')) {
      return numericValue * 180 / Math.PI;
    }
    if (value.endsWith('grad')) {
      return numericValue * 0.9;
    }
    if (value.endsWith('turn')) {
      return numericValue * 360;
    }
    return numericValue;
  }

  override dispose() {
    this._removeAllOverlays();
  }
}