import { EventNames } from "../../../../enums/EventNames";
import { IPoint } from "../../../../interfaces/IPoint.js";
import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { ISize } from "../../../../interfaces/ISize";
import { convertCoordinates, cssMatrixToMatrixArray, getDomMatrix, getRotationAngleFromMatrix, getTransformedCornerPoints} from "../../../helper/TransformHelper.js";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IPlacementView } from "../IPlacementView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class ResizeExtension extends AbstractExtension {

  private resizeAllSelected: boolean;
  private _initialSizes: ISize[];
  private _actionModeStarted: string;
  private _initialPoint: IPoint;
  private _offsetPoint: IPoint;
  private _circle1: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _circle3: SVGCircleElement;
  private _circle4: SVGCircleElement;
  private _circle5: SVGCircleElement;
  private _circle6: SVGCircleElement;
  private _circle7: SVGCircleElement;
  private _circle8: SVGCircleElement;
  private _initialOffsetTop: number;
  private _initialOffsetLeft: number;
  private _initialRect: DOMRect;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem, resizeAllSelected: boolean) {
    super(extensionManager, designerCanvas, extendedItem);
    this.resizeAllSelected = resizeAllSelected;
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    // const rect = this.extendedItem.element.getBoundingClientRect();
        
    let clone = <HTMLElement>this.extendedItem.element.cloneNode();
    let transformedCornerPoints: IPoint3D[] = getTransformedCornerPoints(<HTMLElement>this.extendedItem.element, clone, this.designerCanvas.helperElement, this.designerCanvas, 0);
   
    this._circle1 = this._drawResizerOverlay(transformedCornerPoints[0].x, transformedCornerPoints[0].y, 'nw-resize', this._circle1);
    this._circle2 = this._drawResizerOverlay((transformedCornerPoints[0].x + (transformedCornerPoints[1].x - transformedCornerPoints[0].x) / 2), (transformedCornerPoints[0].y + (transformedCornerPoints[1].y - transformedCornerPoints[0].y) / 2), 'n-resize', this._circle2);
    this._circle3 = this._drawResizerOverlay(transformedCornerPoints[1].x, transformedCornerPoints[1].y, 'ne-resize', this._circle3);

    this._circle4 = this._drawResizerOverlay((transformedCornerPoints[0].x + (transformedCornerPoints[2].x - transformedCornerPoints[0].x) / 2), (transformedCornerPoints[0].y + (transformedCornerPoints[2].y - transformedCornerPoints[0].y) / 2), 'w-resize', this._circle4);
    this._circle5 = this._drawResizerOverlay(transformedCornerPoints[2].x, transformedCornerPoints[2].y, 'sw-resize', this._circle5);

    this._circle6 = this._drawResizerOverlay((transformedCornerPoints[2].x + (transformedCornerPoints[3].x - transformedCornerPoints[2].x) / 2), (transformedCornerPoints[2].y + (transformedCornerPoints[3].y - transformedCornerPoints[2].y) / 2), 's-resize', this._circle6);
    this._circle7 = this._drawResizerOverlay(transformedCornerPoints[3].x, transformedCornerPoints[3].y, 'se-resize', this._circle7);
    this._circle8 = this._drawResizerOverlay((transformedCornerPoints[1].x + (transformedCornerPoints[3].x - transformedCornerPoints[1].x) / 2), (transformedCornerPoints[1].y + (transformedCornerPoints[3].y - transformedCornerPoints[1].y) / 2), 'e-resize', this._circle8);
   
    // if (rect.width < 12) {
    //   this._circle2.style.display = 'none';
    //   this._circle5.style.display = 'none';
    // } else {
    //   this._circle2.style.display = '';
    //   this._circle5.style.display = '';
    // }
    // if (rect.height < 12) {
    //   this._circle7.style.display = 'none';
    //   this._circle8.style.display = 'none';
    // } else {
    //   this._circle8.style.display = '';
    //   this._circle8.style.display = '';
    // }
  }

  _drawResizerOverlay(x: number, y: number, cursor: string, oldCircle?: SVGCircleElement): SVGCircleElement {
    let circle = this._drawCircle(x, y, 3, 'svg-primary-resizer', oldCircle);
    if (!oldCircle) {
      circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(circle, event, cursor));
    }
    circle.setAttribute('style', 'cursor: ' + cursor);
    return circle;
  }

  _pointerActionTypeResize(circle: SVGCircleElement, event: PointerEvent, actionMode: string = 'se-resize') {
    event.stopPropagation();
    const currentPoint = this.designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        this._offsetPoint = { x: cx - currentPoint.x, y: cy - currentPoint.y };
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        console.log("PointerDown > initialPoint: " + this._initialPoint);
        this._initialSizes = [];
        this._actionModeStarted = actionMode;
        this._initialOffsetTop = (<HTMLElement>this.extendedItem.element).offsetTop;
        this._initialOffsetLeft = (<HTMLElement>this.extendedItem.element).offsetLeft;

        let rect = this.extendedItem.element.getBoundingClientRect();
        this._initialRect = rect;
        this._initialSizes.push({ width: rect.width / this.designerCanvas.scaleFactor, height: rect.height / this.designerCanvas.scaleFactor });
        if (this.resizeAllSelected) {
          for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
            rect = designItem.element.getBoundingClientRect();
            this._initialSizes.push({ width: rect.width / this.designerCanvas.scaleFactor, height: rect.height / this.designerCanvas.scaleFactor });
          }
        }
        if (this.designerCanvas.alignOnSnap)
          this.designerCanvas.snapLines.calculateSnaplines(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
        break;

      case EventNames.PointerMove:
        console.log("PointerMove > initialPoint: " + this._initialPoint);
      if (this._initialPoint) {


          const containerStyle = getComputedStyle(this.extendedItem.parent.element);
          const containerService = this.designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.extendedItem.parent, containerStyle))

          const diff = containerService.placePoint(event, <IPlacementView><any>this.designerCanvas, this.extendedItem.parent, this._initialPoint, { x: 0, y: 0 }, currentPoint, this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
          console.log("diffx: " + diff.x);
          console.log("diffy: " + diff.y);
          console.log("this._initialPoint.x: " + this._initialPoint.x);
          console.log("this._initialPoint.y: " + this._initialPoint.y);
          console.log("this._offsetPoint.x: " + this._offsetPoint.x);
          console.log("this._offsetPoint.y: " + this._offsetPoint.y);
          let trackX = Math.round(diff.x - this._initialPoint.x - this._offsetPoint.x);
          let trackY = Math.round(diff.y - this._initialPoint.y - this._offsetPoint.y);
          console.log("trackX: " + trackX);
          console.log("trackY: " + trackY);
          let matrix = getDomMatrix((<HTMLElement>this.extendedItem.element));
          let transformedTrack = convertCoordinates({x:trackX, y:trackY}, matrix);
          

          
          let angle = Math.acos(matrix.a) * (180 / Math.PI);
          

          let i = 0;
          switch (this._actionModeStarted) {
            case 'n-resize':
              if (transformedTrack.y < this._initialSizes[i].height - 8) {

                console.log("Original Height >>> (<HTMLElement>this.extendedItem.element).style.height: " + (<HTMLElement>this.extendedItem.element).style.height);
                console.log("this._initialSizes[i].height: " + this._initialSizes[i].height);
                console.log("transformedTrack.y: " + transformedTrack.y);
                let deltah = transformedTrack.y / Math.cos(angle);
                (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height - deltah + 'px';
                console.log("(<HTMLElement>this.extendedItem.element).style.height: " + (<HTMLElement>this.extendedItem.element).style.height);
                let resizedRect = this.extendedItem.element.getBoundingClientRect();
                (<HTMLElement>this.extendedItem.element).style.top = this._initialOffsetTop - ((resizedRect.height - this._initialRect.height)) + 'px';
                (<HTMLElement>this.extendedItem.element).style.left = this._initialOffsetLeft + ((resizedRect.width - this._initialRect.width) / 2) + 'px';
              }              
              break;
            case 'ne-resize':
              (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';  
              if (transformedTrack.y < this._initialSizes[i].height - 8) {
                (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height - transformedTrack.y + 'px';
                (<HTMLElement>this.extendedItem.element).style.top = this._initialOffsetTop + transformedTrack.y + 'px';
              }              
              break;
             case 'e-resize':
                (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                if (this.resizeAllSelected) {
                  i++;
                  for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    if (designItem !== this.extendedItem) {
                      (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    }
                  }
                }
                break;
            case 'se-resize':
              (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
              (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
              if (this.resizeAllSelected) {
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  i++;
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 's-resize':
              (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 'sw-resize':
              (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
              if (transformedTrack.x < this._initialSizes[i].width - 8) {
                (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width - transformedTrack.x + 'px';
                (<HTMLElement>this.extendedItem.element).style.left = this._initialOffsetLeft + transformedTrack.x + 'px';
              }
              break;
            case 'w-resize':
              if (transformedTrack.x < this._initialSizes[i].width - 8) {
                (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width - transformedTrack.x + 'px';
                (<HTMLElement>this.extendedItem.element).style.left = this._initialOffsetLeft + transformedTrack.x + 'px';
              }
              break;
            case 'nw-resize':
              if (transformedTrack.y < this._initialSizes[i].height - 8) {
                (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height - transformedTrack.y + 'px';
                (<HTMLElement>this.extendedItem.element).style.top = this._initialOffsetTop + transformedTrack.y + 'px';
              }  
              if (transformedTrack.x < this._initialSizes[i].width - 8) {
                (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width - transformedTrack.x + 'px';
                (<HTMLElement>this.extendedItem.element).style.left = this._initialOffsetLeft + transformedTrack.x + 'px';
              }
              break;
          }

          const resizedElements = [this.extendedItem, this.extendedItem.parent];
          if (this.resizeAllSelected)
            resizedElements.push(...this.designerCanvas.instanceServiceContainer.selectionService.selectedElements)
          this.extensionManager.refreshExtensions(resizedElements);
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        
        let cg = this.extendedItem.openGroup("Resize Elements");
        this.extendedItem.setStyle('width', (<HTMLElement>this.extendedItem.element).style.width);
        this.extendedItem.setStyle('height', (<HTMLElement>this.extendedItem.element).style.height);
        if (this.resizeAllSelected) {
          for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
            if (designItem !== this.extendedItem) {
              designItem.setStyle('width', (<HTMLElement>designItem.element).style.width);
              designItem.setStyle('height', (<HTMLElement>designItem.element).style.height);
            }
          }
        }
        cg.commit();
        this._initialSizes = null;
        this._initialPoint = null;
        break;
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}