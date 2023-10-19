import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { NodeType } from '../../../item/NodeType.js';
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

  override extend(cache: Record<string|symbol, any>, event?: Event) {
    this.refresh(cache);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    let transformedCornerPoints: { x: number, y: number }[];
    if (this.extendedItem.nodeType == NodeType.TextNode) {
      let rect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element)
      transformedCornerPoints = [{ x: rect.x, y: rect.y }, { x: rect.x + rect.width, y: rect.y }, { x: rect.x, y: rect.y + rect.height }, { x: rect.x + rect.width, y: rect.y + rect.height }]
    }
    else
      transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas, cache);

    this._line1 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[1].x, transformedCornerPoints[1].y, 'svg-selection', this._line1);
    this._line2 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[2].x, transformedCornerPoints[2].y, 'svg-selection', this._line2);
    this._line3 = this._drawLine(transformedCornerPoints[1].x, transformedCornerPoints[1].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line3);
    this._line4 = this._drawLine(transformedCornerPoints[2].x, transformedCornerPoints[2].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line4);
    this._line1.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line2.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line3.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    this._line4.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}