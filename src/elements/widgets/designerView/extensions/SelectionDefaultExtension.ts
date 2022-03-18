import { IPoint } from "../../../../interfaces/IPoint";
import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { applyMatrixToPoint } from "../../../helper/TransformHelper";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class SelectionDefaultExtension extends AbstractExtension {
  private _rect: SVGRectElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    const itemRect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const computedStyle = getComputedStyle(this.extendedItem.element);
    const left = Number.parseFloat(computedStyle.marginLeft.replace('px', ''));
    const top = Number.parseFloat(computedStyle.marginTop.replace('px', ''));
    const right = Number.parseFloat(computedStyle.marginRight.replace('px', ''));
    const bottom = Number.parseFloat(computedStyle.marginBottom.replace('px', ''));
    //this._rect = this._drawRect(itemRect.x  - left, itemRect.y - top, left + itemRect.width + right, top + itemRect.height + bottom, 'svg-selection', this._rect);
    // this._rect.style.transformOrigin = this.extendedItem.styles.get("transform-origin");
    // this._rect.style.transform = this.extendedItem.styles.get("transform");
    //this.extendedItem.styles.get('transform-origin')

    let clone = <HTMLElement>this.extendedItem.element.cloneNode();
    clone.style.visibility = 'hidden';
    clone.style.transform = '';
    let el = this.designerCanvas.helperElement.appendChild(clone);
    clone = null;
    let boundingRect = el.getBoundingClientRect();
    const cornerPoints:IPoint[] = [
      {
        x: boundingRect.x,
        y: boundingRect.y
      },
      {
        x: boundingRect.x + boundingRect.width,
        y: boundingRect.y
      },
      {
        x: boundingRect.x,
        y: boundingRect.y - boundingRect.height
      },
      {
        x: boundingRect.x + boundingRect.width,
        y: boundingRect.y - boundingRect.height
      }
    ]
    let transformedCornerPoints: IPoint3D[] = [
      {
        x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).x,
        y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).y,
        z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[0]).z
      },
      {
        x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).x,
        y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).y,
        z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[1]).z
      },
      {
        x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).x,
        y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).y,
        z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[2]).z
      },
      {
        x: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).x,
        y: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).y,
        z: applyMatrixToPoint((<HTMLElement>this.extendedItem.element).style.transform, cornerPoints[3]).z
      }
    ]
    
    
    el = null;

  }

  override dispose() {
    this._removeAllOverlays();
  }
}