import { IPoint } from "../../../../interfaces/IPoint";
import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { applyMatrixToElement } from "../../../helper/TransformHelper";
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
    clone.style.visibility = 'hidden';
    clone.style.transform = '';
    let el = this.designerCanvas.helperElement.appendChild(clone);
    clone = null;
    const cloneBoundingRect = this.designerCanvas.getNormalizedElementCoordinates(el);
    const cornerPoints: IPoint[] = [
      {
        x: cloneBoundingRect.x,
        y: cloneBoundingRect.y
      },
      {
        x: cloneBoundingRect.x + cloneBoundingRect.width,
        y: cloneBoundingRect.y
      },
      {
        x: cloneBoundingRect.x,
        y: cloneBoundingRect.y + cloneBoundingRect.height
      },
      {
        x: cloneBoundingRect.x + cloneBoundingRect.width,
        y: cloneBoundingRect.y + cloneBoundingRect.height
      }
    ]
    this.designerCanvas.helperElement.replaceChildren();

    let cornerPointsTranformOrigins = new Array(4);
    cornerPointsTranformOrigins[0] = (parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[0])).toString() + ' ' + (parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[1])).toString();
    cornerPointsTranformOrigins[1] = (cornerPoints[0].x - cornerPoints[1].x + parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[0])).toString() + ' ' + (parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[1])).toString();
    cornerPointsTranformOrigins[2] = (parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[0])).toString() + ' ' + (cornerPoints[0].y - cornerPoints[2].y + parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[1])).toString();
    cornerPointsTranformOrigins[3] = (cornerPoints[0].x - cornerPoints[1].x + parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[0])).toString() + ' ' + (cornerPoints[0].y - cornerPoints[2].y + parseInt(getComputedStyle(this.extendedItem.element).transformOrigin.split(' ')[1])).toString();

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

    const cornerDivs: HTMLDivElement[] = [];
    let element: HTMLDivElement;

    for (let i = 0; i < cornerPointsTranformOrigins.length; i++) {
      element = document.createElement('div');
      element.style.visibility = 'hidden';
      element.style.position = 'absolute';
      element.style.width = "1px";
      element.style.height = "1px";
      element.style.top = cornerPoints[i].y.toString() + 'px';
      element.style.left = cornerPoints[i].x.toString() + 'px';
      element.style.transformOrigin = cornerPointsTranformOrigins[i].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[i].split(' ')[1] + 'px';
      cornerDivs.push(this.designerCanvas.helperElement.appendChild(element));
    }

    // element = document.createElement('div');
    // element.style.visibility = 'hidden';
    // element.style.position = 'absolute';
    // element.style.width = "1px";
    // element.style.height = "1px";
    // element.style.top = cornerPoints[0].y.toString() + 'px';
    // element.style.left = cornerPoints[0].x.toString() + 'px';
    // element.style.transformOrigin = cornerPointsTranformOrigins[0].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[0].split(' ')[1] + 'px';
    // let el0 = this.designerCanvas.helperElement.appendChild(element);
    // cornerDivs.push(el0);

    // element = document.createElement('div');
    // element.style.visibility = 'hidden';
    // element.style.position = 'absolute';
    // element.style.width = "1px";
    // element.style.height = "1px";
    // element.style.top = cornerPoints[1].y.toString() + 'px';;
    // element.style.left = cornerPoints[1].x.toString() + 'px';;
    // element.style.transformOrigin = cornerPointsTranformOrigins[1].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[1].split(' ')[1] + 'px';
    // let el1 = this.designerCanvas.helperElement.appendChild(element);
    // cornerDivs.push(el1);

    // element = document.createElement('div');
    // element.style.visibility = 'hidden';
    // element.style.position = 'absolute';
    // element.style.width = "1px";
    // element.style.height = "1px";
    // element.style.top = cornerPoints[2].y.toString() + 'px';;
    // element.style.left = cornerPoints[2].x.toString() + 'px';;
    // element.style.transformOrigin = cornerPointsTranformOrigins[2].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[2].split(' ')[1] + 'px';
    // let el2 = this.designerCanvas.helperElement.appendChild(element);
    // cornerDivs.push(el2);

    // element = document.createElement('div');
    // element.style.visibility = 'hidden';
    // element.style.position = 'absolute';
    // element.style.width = "1px";
    // element.style.height = "1px";
    // element.style.top = cornerPoints[3].y.toString() + 'px';;
    // element.style.left = cornerPoints[3].x.toString() + 'px';;
    // element.style.transformOrigin = cornerPointsTranformOrigins[3].split(' ')[0] + 'px' + ' ' + cornerPointsTranformOrigins[3].split(' ')[1] + 'px';
    // let el3 = this.designerCanvas.helperElement.appendChild(element);
    // cornerDivs.push(el3);


    let transformedCornerPoints: IPoint3D[] = [];

    for (let i = 0; i < cornerDivs.length; i++) {
      //let transformedCornerDiv: HTMLElement;
      let transformedCornerPoint: IPoint3D = { x: null, y: null, z: null };
      //transformedCornerDiv = applyMatrixToElement((<HTMLElement>this.extendedItem.element).style.transform, cornerDivs[i]);
      cornerDivs[i].style.transform = (<HTMLElement>this.extendedItem.element).style.transform;
      //transformedCornerDiv =  applyMatrixToElement((<HTMLElement>this.extendedItem.element).style.transform, cornerDivs[i]);
      transformedCornerPoint.x = this.designerCanvas.getNormalizedElementCoordinates(cornerDivs[i]).x;
      transformedCornerPoint.y = this.designerCanvas.getNormalizedElementCoordinates(cornerDivs[i]).y;
      transformedCornerPoint.z = 0;
      transformedCornerPoints.push(transformedCornerPoint);
    }

    this._line1 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[1].x, transformedCornerPoints[1].y, 'svg-selection', this._line1);
    this._line2 = this._drawLine(transformedCornerPoints[0].x, transformedCornerPoints[0].y, transformedCornerPoints[2].x, transformedCornerPoints[2].y, 'svg-selection', this._line2);
    this._line3 = this._drawLine(transformedCornerPoints[1].x, transformedCornerPoints[1].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line3);
    this._line4 = this._drawLine(transformedCornerPoints[2].x, transformedCornerPoints[2].y, transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'svg-selection', this._line4);
  }

  override dispose() {
    this._removeAllOverlays();
  }
}