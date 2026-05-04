import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';
import { createOverlayPathDataFromSvgGeometryElement } from '../../../helper/SvgHelper.js';

export interface HighlightElementExtensionOptions {
  useSvgGeometryOutline?: boolean;
  includeSvgMarkers?: boolean;
}

export class HighlightElementExtension extends AbstractExtension {

  private _rect: SVGPathElement;
  private _options: HighlightElementExtensionOptions;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem, options?: HighlightElementExtensionOptions) {
    super(extensionManager, designerView, extendedItem);
    this._options = { useSvgGeometryOutline: true, includeSvgMarkers: true, ...(options ?? {}) };
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    if (this._options.useSvgGeometryOutline) {
      const transformedShapePathData = createOverlayPathDataFromSvgGeometryElement(this.extendedItem.element, this.designerCanvas, { includeMarkers: this._options.includeSvgMarkers });
      if (transformedShapePathData) {
        this._rect = this._drawPath(transformedShapePathData, 'svg-hover-fill', this._rect, OverlayLayer.Background);
        this._rect.style.strokeWidth = (3 / this.designerCanvas.scaleFactor).toString();
        return;
      }
    }

    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ relativeTo: this.designerCanvas.canvas })[0];
    if (!isNaN(transformedCornerPoints.p1.x)) {
      this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-hover', this._rect, OverlayLayer.Background);
      this._rect.style.strokeWidth = (3 / this.designerCanvas.scaleFactor).toString();
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}