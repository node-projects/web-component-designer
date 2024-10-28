import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export class PreviousElementSelectExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  private _path: SVGPathElement;
  private _rect: SVGRectElement;
  private _clickRect: SVGRectElement;
  private _g: SVGGElement;

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!transformedCornerPoints)
      return;

    if (!isNaN(transformedCornerPoints.p2.x)) {
      if (this._valuesHaveChanges(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, this.designerCanvas.scaleFactor)) {
        const angle = Math.atan2((transformedCornerPoints.p2.y - transformedCornerPoints.p1.y), (transformedCornerPoints.p2.x - transformedCornerPoints.p1.x)) * 180 / Math.PI;
        const h = (15 / this.designerCanvas.scaleFactor);
        this._rect = this._drawRect(0, 0, h, h, 'svg-previous-select', this._rect);
        this._clickRect = this._drawRect(0, 0, h, h, 'svg-invisible', this._clickRect);
        if (!this._g) {
          this._g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          this._g.setAttribute('class', 'svg-previous-select');
          this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          this._path.setAttribute('d', 'm4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z');
          this._g.appendChild(this._rect);
          this._g.appendChild(this._path);
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
          this._g.appendChild(this._clickRect);
        }
        this._path.style.scale = (0.6 / this.designerCanvas.scaleFactor).toString();
        this._g.style.translate = (transformedCornerPoints.p2.x - (14.5 / this.designerCanvas.scaleFactor)) + 'px ' + (transformedCornerPoints.p2.y - (15 / this.designerCanvas.scaleFactor)) + 'px';
        this._g.style.rotate =  angle + 'deg';
        this._g.style.transformOrigin = '100% 100%';
        this._g.style.transformBox = 'fill-box'
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}