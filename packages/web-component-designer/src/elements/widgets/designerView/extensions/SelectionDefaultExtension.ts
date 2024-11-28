import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class SelectionDefaultExtension extends AbstractExtension {
  private _line1: SVGLineElement;
  private _line2: SVGLineElement;
  private _line3: SVGLineElement;
  private _line4: SVGLineElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!transformedCornerPoints)
      return;

    if (isNaN(transformedCornerPoints.p1.x) || isNaN(transformedCornerPoints.p2.x)) {
      this.remove();
      return;
    }

    if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, transformedCornerPoints.p4.x, transformedCornerPoints.p4.y)) {
      this._line1 = this._drawLine(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, 'svg-selection', this._line1);
      this._line2 = this._drawLine(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, 'svg-selection', this._line2);
      this._line3 = this._drawLine(transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, 'svg-selection', this._line3);
      this._line4 = this._drawLine(transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, 'svg-selection', this._line4);
      this._line1.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line2.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line3.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
      this._line4.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}