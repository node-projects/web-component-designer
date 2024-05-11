import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class PreviousElementSelectExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  private _rect: SVGRectElement;
  private _clickRect: SVGRectElement;
  private _g: SVGGElement;

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {

    const transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, null, this.designerCanvas, cache);
    if (!isNaN(transformedCornerPoints[1].x)) {
      if (this._valuesHaveChanges(transformedCornerPoints[1].x, transformedCornerPoints[1].y, this.designerCanvas.scaleFactor)) {
        const h = (16 / this.designerCanvas.scaleFactor);
        this._rect = this._drawRect(transformedCornerPoints[1].x - (15 / this.designerCanvas.scaleFactor), transformedCornerPoints[1].y - (16.5 / this.designerCanvas.scaleFactor), h, h, 'svg-previous-select', this._rect);
        this._clickRect = this._drawRect(transformedCornerPoints[1].x - (15 / this.designerCanvas.scaleFactor), transformedCornerPoints[1].y - (16.5 / this.designerCanvas.scaleFactor), h, h+3, 'svg-invisible', this._clickRect);
        if (!this._g) {
          this._g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          this._g.setAttribute('class', 'svg-previous-select');
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute('d', 'm4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z');
          this._g.appendChild(path);
          this._addOverlay(this._g);
          this._clickRect.onpointerdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.extendedItem.instanceServiceContainer.selectionService.setSelectedElements([this.extendedItem.parent]);
          };
          this._clickRect.onpointermove = (e) => {
            e.preventDefault();
            e.stopPropagation();
          }
        }
        this._g.setAttribute('transform', 'translate(' + (transformedCornerPoints[1].x - (14.5 / this.designerCanvas.scaleFactor)) + ',' + (transformedCornerPoints[1].y - (15.5 / this.designerCanvas.scaleFactor)) + ') scale(' + 0.6 / this.designerCanvas.scaleFactor + ')');
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}