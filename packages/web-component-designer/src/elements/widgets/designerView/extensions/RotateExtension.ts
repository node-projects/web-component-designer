import { IPoint } from '../../../../interfaces/IPoint.js';
import { hasCommandKey } from '../../../helper/KeyboardHelper.js';
import { roundValue } from '../../../helper/LayoutHelper.js';
import { getElementSize } from '../../../helper/getBoxQuads.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class RotateExtension extends AbstractExtension {

  private _rotateLine: SVGLineElement;
  private _rotateCircle: SVGCircleElement;
  private _startPoint: IPoint;
  private _rotateCirclePosition: IPoint;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }


  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const size = getElementSize(this.extendedItem.element);

    let p1 = { x: size.width / 2, y: -30 / this.designerCanvas.zoomFactor };

    let l1 = { x: size.width / 2, y: -22 / this.designerCanvas.zoomFactor };
    let l2 = { x: size.width / 2, y: -6 / this.designerCanvas.zoomFactor };

    this._rotateCirclePosition = p1;

    let p1t = this.designerCanvas.canvas.convertPointFromNode(p1, this.extendedItem.element);
    let l1t = this.designerCanvas.canvas.convertPointFromNode(l1, this.extendedItem.element);
    let l2t = this.designerCanvas.canvas.convertPointFromNode(l2, this.extendedItem.element);
    this._rotateLine = this._drawLine(l1t.x, l1t.y, l2t.x, l2t.y, 'svg-primary-rotate-line', this._rotateLine);
    this._rotateLine.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

    if (!this._rotateCircle) {
      this._rotateCircle = this._drawCircle(p1t.x, p1t.y, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

      this._rotateCircle.addEventListener("pointerdown", e => {
        e.stopPropagation();
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
      this._rotateCircle = this._drawCircle(p1t.x, p1t.y, 5 / this.designerCanvas.zoomFactor, 'svg-primary-rotate', this._rotateCircle);
      this._rotateCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
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

