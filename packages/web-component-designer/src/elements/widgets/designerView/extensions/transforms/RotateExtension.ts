import { IPoint } from '../../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../../helper/KeyboardHelper.js';
import { roundValue } from '../../../../helper/LayoutHelper.js';
import { getElementSize } from '../../../../helper/getBoxQuads.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { getEdgeOffsetPoint, getQuadCenter } from '../../../../helper/QuadEdgeHandleHelper.js';

export class RotateExtension extends AbstractExtension {

  private _rotateLine?: SVGLineElement;
  private _rotateCircle?: SVGCircleElement;
  private _startPoint: IPoint | null = null;
  private _rotateCirclePosition: IPoint = { x: 0, y: 0 };

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

    if (!this._valuesHaveChanges(this.designerCanvas.zoomFactor, ...points.flatMap(point => [point.x, point.y]))) {
      return;
    }

    const quadCenter = getQuadCenter(quad);
    const handlePoint = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 30 / this.designerCanvas.zoomFactor, { x: 0, y: -1 });
    const lineStart = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 22 / this.designerCanvas.zoomFactor, { x: 0, y: -1 });
    const lineEnd = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 6 / this.designerCanvas.zoomFactor, { x: 0, y: -1 });

    this._rotateLine = this._drawLine(lineStart.x, lineStart.y, lineEnd.x, lineEnd.y, 'svg-primary-rotate-line', this._rotateLine);
    this._rotateLine.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

    if (!this._rotateCircle) {
      this._rotateCircle = this._drawCircle(handlePoint.x, handlePoint.y, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

      this._rotateCircle.addEventListener("pointerdown", e => {
        e.stopPropagation();
        this._rotateCirclePosition = this._getRotateReferencePoint();
        (<Element>e.target).setPointerCapture(e.pointerId);
        let mp = this.designerCanvas.getNormalizedEventCoordinates(e);
        this._startPoint = this.extendedItem.element.convertPointFromNode({ x: mp.x, y: mp.y }, this.designerCanvas.canvas);
      });
      this._rotateCircle.addEventListener("pointermove", e => {
        e.stopPropagation();

        if (this._startPoint) {
          //@ts-ignore
          this.extendedItem.element.style.rotate = 'none';
          //@ts-ignore
          this.extendedItem.element.style.rotate = this.getAngle(e) + 'deg';
        }
      });
      this._rotateCircle.addEventListener("pointerup", e => {
        e.stopPropagation();
        (<Element>e.target).releasePointerCapture(e.pointerId);
        this._startPoint = null;
        //@ts-ignore
        this.extendedItem.element.style.rotate = 'none';
        this.extendedItem.setStyle('rotate', this.getAngle(e) + 'deg')
      });
    } else {
      this._rotateCircle = this._drawCircle(handlePoint.x, handlePoint.y, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    }
  }

  private _getRotateReferencePoint() {
    const element = this.extendedItem.element as HTMLElement;
    const size = getElementSize(this.extendedItem.element);
    const fallback = { x: size.width / 2, y: -30 / this.designerCanvas.zoomFactor };
    const inlineRotate = element.style.rotate;

    try {
      element.style.rotate = 'none';
      const quad = element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
      if (!quad) {
        return fallback;
      }

      const quadCenter = getQuadCenter(quad);
      const handlePoint = getEdgeOffsetPoint(quad.p1, quad.p2, quadCenter, 30 / this.designerCanvas.zoomFactor, { x: 0, y: -1 });
      const localPoint = element.convertPointFromNode(handlePoint, this.designerCanvas.canvas);
      if (!Number.isFinite(localPoint.x) || !Number.isFinite(localPoint.y)) {
        return fallback;
      }
      return { x: localPoint.x, y: localPoint.y };
    } finally {
      element.style.rotate = inlineRotate;
    }
  }

  getAngle(e: MouseEvent) {
    let mp = this.designerCanvas.getNormalizedEventCoordinates(e);
    let p1 = { x: mp.x, y: mp.y };
    let p1t = this.extendedItem.element.convertPointFromNode(p1, this.designerCanvas.canvas);

    const cs = getComputedStyle(this.extendedItem.element);
    const orig = cs.transformOrigin.split(' ');
    const pOrg = { x: parseFloat(orig[0]), y: parseFloat(orig[1]) };

    const angleFromRotatingPoint = (Math.atan2(this._rotateCirclePosition.y - pOrg.y, this._rotateCirclePosition.x - pOrg.x) * 180 / Math.PI) + 90;
    let angle = (Math.atan2(p1t.y - pOrg.y, p1t.x - pOrg.x) * 180 / Math.PI) + 90 - angleFromRotatingPoint;

    if (!hasCommandKey(e))
      angle = Math.round(angle / 15) * 15;
    return roundValue(this.extendedItem, angle);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}

