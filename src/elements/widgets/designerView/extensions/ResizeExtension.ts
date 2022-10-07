import { EventNames } from "../../../../enums/EventNames";
import { IPoint } from "../../../../interfaces/IPoint.js";
import { IPoint3D } from "../../../../interfaces/IPoint3d";
import { ISize } from "../../../../interfaces/ISize";
import { convertCoordinates, getDomMatrix, getTransformedCornerPoints } from "../../../helper/TransformHelper.js";
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
  private _initialComputedTransformOrigins: DOMPoint[];
  private _initialTransformOrigins: string[];

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem, resizeAllSelected: boolean) {
    super(extensionManager, designerCanvas, extendedItem);
    this.resizeAllSelected = resizeAllSelected;
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    //#region Resizer circles
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
    //#endregion Circles
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

  _pointerActionTypeResize(circle: SVGCircleElement, event: PointerEvent, actionMode: string) {
    event.stopPropagation();
    const currentPoint = this.designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        this._offsetPoint = { x: cx - currentPoint.x, y: cy - currentPoint.y };
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._initialSizes = [];
        this._actionModeStarted = actionMode;
        this._initialComputedTransformOrigins = [];
        this._initialTransformOrigins = [];

        //#region Calc elements' dimension
        const transformBackup = (<HTMLElement>this.extendedItem.element).style.transform;
        (<HTMLElement>this.extendedItem.element).style.transform = '';
        let rect = this.extendedItem.element.getBoundingClientRect();
        (<HTMLElement>this.extendedItem.element).style.transform = transformBackup;
        //#endregion Calc element's dimension

        this._initialSizes.push({ width: rect.width / this.designerCanvas.scaleFactor, height: rect.height / this.designerCanvas.scaleFactor });

        (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[0].width + 'px';

        const toArr = getComputedStyle(this.extendedItem.element).transformOrigin.split(' ').map(x => parseInt(x.replace('px', '')));
        const transformOrigin: DOMPoint = new DOMPoint(toArr[0], toArr[1]);
        this._initialComputedTransformOrigins.push(transformOrigin);
        this._initialTransformOrigins.push((<HTMLElement>this.extendedItem.element).style.transformOrigin);

        if (this.resizeAllSelected) {
          for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
            rect = designItem.element.getBoundingClientRect();
            this._initialSizes.push({ width: rect.width / this.designerCanvas.scaleFactor, height: rect.height / this.designerCanvas.scaleFactor });
          }
        }
        if (this.designerCanvas.alignOnSnap)
          this.designerCanvas.snapLines.calculateSnaplines(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);

          let i = 0;
        let top: string = null;
        let bottom: string = null;
        let left: string = null;
        let right: string = null;

        switch (this._actionModeStarted) {
          case 'e-resize':
            left = getComputedStyle(this.extendedItem.element).left;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('right');
            (<HTMLElement>this.extendedItem.element).style.left = left;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
            break;
          case 'se-resize':
            top = getComputedStyle(this.extendedItem.element).top;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('bottom');
            (<HTMLElement>this.extendedItem.element).style.top = top;
            left = getComputedStyle(this.extendedItem.element).left;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('right');
            (<HTMLElement>this.extendedItem.element).style.left = left;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
            break;
          case 's-resize':
            top = getComputedStyle(this.extendedItem.element).top;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('bottom');
            (<HTMLElement>this.extendedItem.element).style.top = top;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
            break;
          case 'sw-resize':
            top = getComputedStyle(this.extendedItem.element).top;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('bottom');
            (<HTMLElement>this.extendedItem.element).style.top = top;
            right = getComputedStyle(this.extendedItem.element).right;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('left');
            (<HTMLElement>this.extendedItem.element).style.right = right;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
            break;
          case 'w-resize':
            right = getComputedStyle(this.extendedItem.element).right;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('left');
            (<HTMLElement>this.extendedItem.element).style.right = right;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
            break;
          case 'nw-resize':
            bottom = getComputedStyle(this.extendedItem.element).bottom;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('top');
            (<HTMLElement>this.extendedItem.element).style.bottom = bottom;
            right = getComputedStyle(this.extendedItem.element).right;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('left');
            (<HTMLElement>this.extendedItem.element).style.right = right;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
            break;
          case 'n-resize':
            bottom = getComputedStyle(this.extendedItem.element).bottom;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('top');
            (<HTMLElement>this.extendedItem.element).style.bottom = bottom;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
            break;
          case 'ne-resize':
            bottom = getComputedStyle(this.extendedItem.element).bottom;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('top');
            (<HTMLElement>this.extendedItem.element).style.bottom = bottom;
            left = getComputedStyle(this.extendedItem.element).left;
            (<HTMLElement>this.extendedItem.element).style.removeProperty('right');
            (<HTMLElement>this.extendedItem.element).style.left = left;
            (<HTMLElement>this.extendedItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
            break;
        }
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          const containerStyle = getComputedStyle(this.extendedItem.parent.element);
          const containerService = this.designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.extendedItem.parent, containerStyle))

          const diff = containerService.placePoint(event, <IPlacementView><any>this.designerCanvas, this.extendedItem.parent, this._initialPoint, { x: 0, y: 0 }, currentPoint, this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
          let trackX = Math.round(diff.x - this._initialPoint.x - this._offsetPoint.x);
          let trackY = Math.round(diff.y - this._initialPoint.y - this._offsetPoint.y);
          let matrix = getDomMatrix((<HTMLElement>this.extendedItem.element));
          let transformedTrack = convertCoordinates(new DOMPoint(trackX, trackY, 0, 0), matrix);

          let i = 0;

          let width = null;
          let height = null;

          switch (this._actionModeStarted) {
            case 'e-resize':
              width = (this._initialSizes[i].width + transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';

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
              width = (this._initialSizes[i].width + transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';
              height = (this._initialSizes[i].height + transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 's-resize':
              height = (this._initialSizes[i].height + transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

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
              width = (this._initialSizes[i].width - transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';
              height = (this._initialSizes[i].height + transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 'w-resize':
              width = (this._initialSizes[i].width - transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                  }
                }
              }
              break;
            case 'nw-resize':
              width = (this._initialSizes[i].width - transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';
              height = (this._initialSizes[i].height - transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 'n-resize':
              height = (this._initialSizes[i].height - transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
              }
              break;
            case 'ne-resize':
              width = (this._initialSizes[i].width + transformedTrack.x);
              (<HTMLElement>this.extendedItem.element).style.width = width + 'px';
              height = (this._initialSizes[i].height - transformedTrack.y);
              (<HTMLElement>this.extendedItem.element).style.height = height + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + transformedTrack.x + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + transformedTrack.y + 'px';
                  }
                }
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

        let transformedRect = this.extendedItem.element.getBoundingClientRect();
        (<HTMLElement>this.extendedItem.element).style.transformOrigin = this._initialTransformOrigins[0];
        let transformedRectWithOriginalTransformOrigin = this.extendedItem.element.getBoundingClientRect();
        let deltaX = transformedRectWithOriginalTransformOrigin.x - transformedRect.x;
        let deltaY = transformedRectWithOriginalTransformOrigin.y - transformedRect.y;
        let matrix = null;

        switch (this._actionModeStarted) {
          case 'e-resize':
            matrix = new DOMMatrix(getComputedStyle((<HTMLElement>this.extendedItem.element)).transform).translate(deltaX, -deltaY);
            break;
          case 'se-resize':
            break;
          case 's-resize':
            matrix = new DOMMatrix(getComputedStyle((<HTMLElement>this.extendedItem.element)).transform).translate(-deltaX, deltaY);
            break;
          case 'sw-resize':
            break;
          case 'w-resize':
            matrix = new DOMMatrix(getComputedStyle((<HTMLElement>this.extendedItem.element)).transform).translate(-deltaX, deltaY);
            break;
        }
        if (matrix)
          (<HTMLElement>this.extendedItem.element).style.transform = matrix.toString();
        this.extendedItem.setStyle('transform', (<HTMLElement>this.extendedItem.element).style.transform);
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