import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from "./AbstractExtension";
import { IExtensionManager } from "./IExtensionManger";

const offset = 3;

export class MouseOverExtension extends AbstractExtension {

  private _rect: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, { x: offset, y: offset }, this.designerCanvas);
    this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-hover', this._rect);
    this._rect.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}