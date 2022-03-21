import { IPoint } from "../../../../interfaces/IPoint";
import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { applyMatrixToElement, calcCornerPoints, getTransformedCornerPoints } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class SelectionDefaultExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let clone = <HTMLElement>this.extendedItem.element.cloneNode();
    let transformedCornerPoints: IPoint3D[] = getTransformedCornerPoints(clone, this.designerCanvas.helperElement, this.designerCanvas, 0);

    // console.log("cornerPoint0x: " + cornerPoints[0].x, "cornerPoint0y: " + cornerPoints[0].y, "actualElementTransform: " + (<HTMLElement>this.extendedItem.element).style.transform);
    // let transformedCornerPoints: IPoint3D[] = [
    //   {
    //     x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).x,
    //     y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).y,
    //     z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).z
    //   },
    //   {
    //     x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).x,
    //     y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).y,
    //     z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).z
    //   },
    //   {
    //     x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).x,
    //     y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).y,
    //     z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).z
    //   },
    //   {
    //     x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).x,
    //     y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).y,
    //     z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).z
    //   }
    // ]

    this._line1 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[1].x, transformedCornerPoints[1].y, 'svg-selection', this._line1);
    this._line2 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[2].x, transformedCornerPoints[2].y, 'svg-selection', this._line2);
    this._line3 = this._drawLine(transformedCornerPoints[1].x, transformedCornerPoints[1].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line3);
    this._line4 = this._drawLine(transformedCornerPoints[2].x, transformedCornerPoints[2].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line4);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}