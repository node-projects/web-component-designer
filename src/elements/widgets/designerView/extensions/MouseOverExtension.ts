import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from "../../../helper/TransformHelper";
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
    let transformedCornerPoints: DOMPoint[] = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, offset, this.designerCanvas.helperElement, this.designerCanvas);

    this._line1 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[1].x, transformedCornerPoints[1].y, 'svg-hover', this._line1);
    this._line2 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[2].x, transformedCornerPoints[2].y, 'svg-hover', this._line2);
    this._line3 = this._drawLine(transformedCornerPoints[1].x, transformedCornerPoints[1].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-hover', this._line3);
    this._line4 = this._drawLine(transformedCornerPoints[2].x, transformedCornerPoints[2].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-hover', this._line4);
    this._line1.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line2.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line3.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line4.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}