import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { getTransformedCornerPoints } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

const offset = 3;

export class MouseOverExtension extends AbstractExtension {

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
    let transformedCornerPoints: IPoint3D[] = getTransformedCornerPoints(clone, this.designerCanvas.helperElement, this.designerCanvas);

    this._line1 = this._drawLine(transformedCornerPoints[0].x - offset, transformedCornerPoints[0].y - offset, transformedCornerPoints[1].x + offset, transformedCornerPoints[1].y - offset, 'svg-hover', this._line1);
    this._line2 = this._drawLine(transformedCornerPoints[0].x - offset, transformedCornerPoints[0].y - offset, transformedCornerPoints[2].x - offset, transformedCornerPoints[2].y + offset, 'svg-hover', this._line2);
    this._line3 = this._drawLine(transformedCornerPoints[1].x + offset, transformedCornerPoints[1].y - offset, transformedCornerPoints[3].x + offset, transformedCornerPoints[3].y + offset, 'svg-hover', this._line3);
    this._line4 = this._drawLine(transformedCornerPoints[2].x - offset, transformedCornerPoints[2].y + offset, transformedCornerPoints[3].x + offset, transformedCornerPoints[3].y + offset, 'svg-hover', this._line4);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}