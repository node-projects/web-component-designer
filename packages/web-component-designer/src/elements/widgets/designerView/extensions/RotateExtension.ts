import { IPoint } from '../../../../interfaces/IPoint.js';
import { convertPointFromNode, getElementSize } from '../../../helper/getBoxQuads.js';
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

    let p1 = { x: size.width / 2, y: -30 };

    let l1 = { x: size.width / 2, y: -22 };
    let l2 = { x: size.width / 2, y: -6 };

    this._rotateCirclePosition = p1;

    let p1t = convertPointFromNode(this.designerCanvas.canvas, p1, this.extendedItem.element);
    let l1t = convertPointFromNode(this.designerCanvas.canvas, l1, this.extendedItem.element);
    let l2t = convertPointFromNode(this.designerCanvas.canvas, l2, this.extendedItem.element);
    this._rotateLine = this._drawLine(l1t.x, l1t.y, l2t.x, l2t.y, 'svg-primary-rotate-line', this._rotateLine);

    if (!this._rotateCircle) {
      this._rotateCircle = this._drawCircle(p1t.x, p1t.y, 5, 'svg-primary-rotate', this._rotateCircle);

      this._rotateCircle.addEventListener("pointerdown", e => {
        e.stopPropagation();
        (<Element>e.target).setPointerCapture(e.pointerId);
        let mp = this.designerCanvas.getNormalizedEventCoordinates(e);
        this._startPoint = convertPointFromNode(this.extendedItem.element, { x: mp.x, y: mp.y }, this.designerCanvas.canvas);
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
      this._rotateCircle = this._drawCircle(p1t.x, p1t.y, 5, 'svg-primary-rotate', this._rotateCircle);
    }

    this.addRotatePosition(p1t, 'svg-primary-rotate');
  }

  getAngle(e: MouseEvent) {
    let mp = this.designerCanvas.getNormalizedEventCoordinates(e);
    let p1 = { x: mp.x, y: mp.y };
    let p1t = convertPointFromNode(this.extendedItem.element, p1, this.designerCanvas.canvas);

    const cs = getComputedStyle(this.extendedItem.element);
    const orig = cs.transformOrigin.split(' ');
    const pOrg = { x: parseFloat(orig[0]), y: parseFloat(orig[1]) };

    const angleFromRotatingPoint = (Math.atan2(this._rotateCirclePosition.y - pOrg.y, this._rotateCirclePosition.x - pOrg.x) * 180 / Math.PI) + 90;
    const angle = (Math.atan2(p1t.y - pOrg.y, p1t.x - pOrg.x) * 180 / Math.PI) + 90 - angleFromRotatingPoint;
    return angle;
  }

  addRotatePosition(point: IPoint, classname: string) {
  }

  override dispose() {
    this._removeAllOverlays();
  }
}

