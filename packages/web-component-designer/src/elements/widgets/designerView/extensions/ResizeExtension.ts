import { EventNames } from '../../../../enums/EventNames.js';
import { IPoint } from "../../../../interfaces/IPoint.js";
import { ISize } from '../../../../interfaces/ISize.js';
import { getContentBoxContentOffsets } from '../../../helper/ElementHelper.js';
import { roundValue } from '../../../helper/LayoutHelper.js';
import { getElementSize } from '../../../helper/getBoxQuads.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';

export function normalizeToAbsolutePosition(element: HTMLElement, normalizeProperty: "left" | "top") {
  switch (normalizeProperty) {
    case "left":
      let left = getComputedStyle(element).left;
      (<HTMLElement>element).style.removeProperty('right');
      (<HTMLElement>element).style.left = left;
      return left;
    case "top":
      let top = getComputedStyle(element).top;
      (<HTMLElement>element).style.removeProperty('bottom');
      (<HTMLElement>element).style.top = top;
      return top;
  }
}

//TODO: use PlacementService, size is not always width/height could also be margin etc...
//      also when elment aligned to bottom, will it later also be?
export class ResizeExtension extends AbstractExtension {

  private resizeAllSelected: boolean;
  private _initialSizes: ISize[] | null = null;
  private _actionModeStarted!: string;
  private _initialPoint: IPoint | null = null;
  private _offsetPoint!: IPoint;
  private _circle1?: SVGCircleElement;
  private _circle2?: SVGCircleElement;
  private _circle3?: SVGCircleElement;
  private _circle4?: SVGCircleElement;
  private _circle5?: SVGCircleElement;
  private _circle6?: SVGCircleElement;
  private _circle7?: SVGCircleElement;
  private _circle8?: SVGCircleElement;
  private _initialHandleLocalPoint: DOMPoint | null = null;
  private _initialFixedResizeAnchor: DOMPoint | null = null;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, extendedItem: IDesignItem, resizeAllSelected: boolean) {
    super(extensionManager, designerCanvas, extendedItem);
    this.resizeAllSelected = resizeAllSelected;
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    let transformedCornerPoints = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
    if (!transformedCornerPoints)
      return;

    if (isNaN(transformedCornerPoints.p1.x) || isNaN(transformedCornerPoints.p1.x)) {
      this.remove();
      return;
    }
    if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, transformedCornerPoints.p4.x, transformedCornerPoints.p4.y)) {
      this._circle1 = this._drawResizerOverlay(transformedCornerPoints.p1.x, transformedCornerPoints.p1.y, 'nw-resize', this._circle1);
      this._circle2 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p2.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p2.y - transformedCornerPoints.p1.y) / 2), 'n-resize', this._circle2);
      this._circle3 = this._drawResizerOverlay(transformedCornerPoints.p2.x, transformedCornerPoints.p2.y, 'ne-resize', this._circle3);

      this._circle4 = this._drawResizerOverlay((transformedCornerPoints.p1.x + (transformedCornerPoints.p4.x - transformedCornerPoints.p1.x) / 2), (transformedCornerPoints.p1.y + (transformedCornerPoints.p4.y - transformedCornerPoints.p1.y) / 2), 'w-resize', this._circle4);
      this._circle5 = this._drawResizerOverlay(transformedCornerPoints.p4.x, transformedCornerPoints.p4.y, 'sw-resize', this._circle5);

      this._circle6 = this._drawResizerOverlay((transformedCornerPoints.p4.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p4.x) / 2), (transformedCornerPoints.p4.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p4.y) / 2), 's-resize', this._circle6);
      this._circle8 = this._drawResizerOverlay((transformedCornerPoints.p2.x + (transformedCornerPoints.p3.x - transformedCornerPoints.p2.x) / 2), (transformedCornerPoints.p2.y + (transformedCornerPoints.p3.y - transformedCornerPoints.p2.y) / 2), 'e-resize', this._circle8);

      this._circle7 = this._drawResizerOverlay(transformedCornerPoints.p3.x, transformedCornerPoints.p3.y, 'se-resize', this._circle7);
    }
  }

  _drawResizerOverlay(x: number, y: number, cursor: string, oldCircle?: SVGCircleElement): SVGCircleElement {
    let circle = this._drawCircle(x, y, this.designerCanvas.serviceContainer.options.resizerPixelSize / this.designerCanvas.zoomFactor, 'svg-primary-resizer', oldCircle);
    circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
    if (!oldCircle) {
      circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(circle, event, cursor));
      circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(circle, event, cursor));
    }
    circle.style.cursor = cursor;
    return circle;
  }

  _pointerActionTypeResize(circle: SVGCircleElement, event: PointerEvent, actionMode: string) {
    event.stopPropagation();
    const currentPoint = this.designerCanvas.getNormalizedEventCoordinates(event);

    //TODO: calculate new position and size in the extension
    //aply the values with the position service
    //don't switch from left positioning to right and so on...
    switch (event.type) {
      case EventNames.PointerDown:
        const cx = parseFloat(circle.getAttribute('cx') ?? '0');
        const cy = parseFloat(circle.getAttribute('cy') ?? '0');
        this._offsetPoint = { x: cx - currentPoint.x, y: cy - currentPoint.y };
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._initialHandleLocalPoint = this.extendedItem.element.convertPointFromNode(new DOMPoint(cx, cy), this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });
        this._initialFixedResizeAnchor = this._getFixedResizeAnchor(this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas, iframes: this.designerCanvas.iframes })[0], actionMode);
        this._initialSizes = [];
        this._actionModeStarted = actionMode;

        this._initialSizes.push(this._getInitialSize(this.extendedItem.element));

        if (this.resizeAllSelected) {
          for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
            this._initialSizes.push(this._getInitialSize(designItem.element));
          }
        }
        if (this.designerCanvas.alignOnSnap)
          this.designerCanvas.snapLines.calculateSnaplines(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);

        this.prepareResize(this.extendedItem, this._actionModeStarted)
        if (this.resizeAllSelected) {
          for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
            if (designItem !== this.extendedItem) {
              this.prepareResize(designItem, this._actionModeStarted);
            }
          }
        }

        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          if (!this._initialSizes || !this._initialHandleLocalPoint) {
            return;
          }

          const containerStyle = getComputedStyle(this.extendedItem.parent.element);
          const containerService = this.designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.extendedItem.parent, containerStyle))

          const diff = containerService.placePoint(event, this.designerCanvas, this.extendedItem.parent, this._initialPoint, { x: 0, y: 0 }, currentPoint, this.designerCanvas.instanceServiceContainer.selectionService.selectedElements);
          const currentHandleLocalPoint = this.extendedItem.element.convertPointFromNode(new DOMPoint(diff.x + this._offsetPoint.x, diff.y + this._offsetPoint.y), this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });

          let deltaX = currentHandleLocalPoint.x - this._initialHandleLocalPoint.x;
          let deltaY = currentHandleLocalPoint.y - this._initialHandleLocalPoint.y;

          if (event.shiftKey) {
            deltaX = deltaX < deltaY ? deltaX : deltaY;
            deltaY = deltaX;
          }

          let i = 0;

          let width = null;
          let height = null;

          switch (this._actionModeStarted) {
            case 'e-resize':
              width = (this._initialSizes[i].width + deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                  }
                }
              }
              break;
            case 'se-resize':
              width = (this._initialSizes[i].width + deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';
              height = (this._initialSizes[i].height + deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';
              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                  }
                }
              }
              break;
            case 's-resize':
              height = (this._initialSizes[i].height + deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                  }
                }
              }
              break;
            case 'sw-resize':
              width = (this._initialSizes[i].width - deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';
              height = (this._initialSizes[i].height + deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height + deltaY) + 'px';
                  }
                }
              }
              break;
            case 'w-resize':
              width = (this._initialSizes[i].width - deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                  }
                }
              }
              break;
            case 'nw-resize':
              width = (this._initialSizes[i].width - deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';
              height = (this._initialSizes[i].height - deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width - deltaX) + 'px';
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                  }
                }
              }
              break;
            case 'n-resize':
              height = (this._initialSizes[i].height - deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                  }
                }
              }
              break;
            case 'ne-resize':
              width = (this._initialSizes[i].width + deltaX);
              (<HTMLElement>this.extendedItem.element).style.width = roundValue(this.extendedItem, width) + 'px';
              height = (this._initialSizes[i].height - deltaY);
              (<HTMLElement>this.extendedItem.element).style.height = roundValue(this.extendedItem, height) + 'px';

              if (this.resizeAllSelected) {
                i++;
                for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = roundValue(this.extendedItem, this._initialSizes[i].width + deltaX) + 'px';
                    (<HTMLElement>designItem.element).style.height = roundValue(this.extendedItem, this._initialSizes[i].height - deltaY) + 'px';
                  }
                }
              }
              break;
          }

          this._applyAnchorCorrection();

          const resizedElements = [this.extendedItem, this.extendedItem.parent];
          if (this.resizeAllSelected)
            resizedElements.push(...this.designerCanvas.instanceServiceContainer.selectionService.selectedElements)
          this.extensionManager.refreshExtensions(resizedElements);
          this.designerCanvas?.raiseDesignItemsChanged(resizedElements, 'resize', false);
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        if (!this._initialPoint) {
          return;
        }

        let cg = this.extendedItem.openGroup((this.resizeAllSelected && this.designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 1) ? "Resize Elements" : "Resize &lt;" + this.extendedItem.name + "&gt;");
        try {
          const element = <HTMLElement>this.extendedItem.element;
          this.extendedItem.setStyle('width', (<HTMLElement>this.extendedItem.element).style.width);
          this.extendedItem.setStyle('height', (<HTMLElement>this.extendedItem.element).style.height);

          let left = parseFloat(normalizeToAbsolutePosition(element, 'left'));
          let top = parseFloat(normalizeToAbsolutePosition(element, 'top'));
          const anchorCorrection = this._getAnchorCorrectionInParent();
          if (anchorCorrection) {
            left += anchorCorrection.x;
            top += anchorCorrection.y;
            element.style.left = roundValue(this.extendedItem, left) + 'px';
            element.style.top = roundValue(this.extendedItem, top) + 'px';
          }

          this.extendedItem.setStyle('left', roundValue(this.extendedItem, left) + 'px');
          this.extendedItem.setStyle('top', roundValue(this.extendedItem, top) + 'px');

          if (this.resizeAllSelected) {
            for (const designItem of this.designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
              if (designItem !== this.extendedItem) {
                designItem.setStyle('width', (<HTMLElement>designItem.element).style.width);
                designItem.setStyle('height', (<HTMLElement>designItem.element).style.height);

                designItem.setStyle('left', roundValue(this.extendedItem, parseFloat(normalizeToAbsolutePosition(<HTMLElement>designItem.element, 'left'))) + 'px');
                designItem.setStyle('top', roundValue(this.extendedItem, parseFloat(normalizeToAbsolutePosition(<HTMLElement>designItem.element, 'top'))) + 'px');
              }
            }
            this.designerCanvas?.raiseDesignItemsChanged(this.designerCanvas.instanceServiceContainer.selectionService.selectedElements, 'resize', true);
          }
          else {
            this.designerCanvas?.raiseDesignItemsChanged([this.extendedItem], 'resize', true);
          }
          cg.commit();
        }
        catch (err) {
          cg.abort();
          console.error(err)
        }
        this._initialSizes = null;
        this._initialPoint = null;
        this._initialHandleLocalPoint = null;
        this._initialFixedResizeAnchor = null;
        break;
    }
  }

  private _getInitialSize(element: Element): ISize {
    const size = getElementSize(element);
    let contentBoxOffset: IPoint = { x: 0, y: 0 };
    if (getComputedStyle(<HTMLElement>element).boxSizing == 'content-box') {
      contentBoxOffset = getContentBoxContentOffsets(<HTMLElement>element);
    }
    return { width: size.width - contentBoxOffset.x, height: size.height - contentBoxOffset.y };
  }

  private _getFixedResizeAnchor(quad: DOMQuad, mode: string): DOMPoint | null {
    if (!quad) {
      return null;
    }

    switch (mode) {
      case 'e-resize':
        return new DOMPoint((quad.p1.x + quad.p4.x) / 2, (quad.p1.y + quad.p4.y) / 2);
      case 'se-resize':
        return new DOMPoint(quad.p1.x, quad.p1.y);
      case 's-resize':
        return new DOMPoint((quad.p1.x + quad.p2.x) / 2, (quad.p1.y + quad.p2.y) / 2);
      case 'sw-resize':
        return new DOMPoint(quad.p2.x, quad.p2.y);
      case 'w-resize':
        return new DOMPoint((quad.p2.x + quad.p3.x) / 2, (quad.p2.y + quad.p3.y) / 2);
      case 'nw-resize':
        return new DOMPoint(quad.p3.x, quad.p3.y);
      case 'n-resize':
        return new DOMPoint((quad.p4.x + quad.p3.x) / 2, (quad.p4.y + quad.p3.y) / 2);
      case 'ne-resize':
        return new DOMPoint(quad.p4.x, quad.p4.y);
      default:
        return null;
    }
  }

  private _getAnchorCorrectionInParent(): IPoint | null {
    if (!this._initialFixedResizeAnchor) {
      return null;
    }

    const currentAnchor = this._getFixedResizeAnchor(this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas, iframes: this.designerCanvas.iframes })[0], this._actionModeStarted);
    if (!currentAnchor) {
      return null;
    }

    const initialAnchorInParent = this.extendedItem.parent.element.convertPointFromNode(this._initialFixedResizeAnchor, this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });
    const currentAnchorInParent = this.extendedItem.parent.element.convertPointFromNode(currentAnchor, this.designerCanvas.canvas, { iframes: this.designerCanvas.iframes });

    return {
      x: initialAnchorInParent.x - currentAnchorInParent.x,
      y: initialAnchorInParent.y - currentAnchorInParent.y
    };
  }

  private _applyAnchorCorrection() {
    const anchorCorrection = this._getAnchorCorrectionInParent();
    if (!anchorCorrection) {
      return;
    }

    const element = <HTMLElement>this.extendedItem.element;
    const left = parseFloat(normalizeToAbsolutePosition(element, 'left')) + anchorCorrection.x;
    const top = parseFloat(normalizeToAbsolutePosition(element, 'top')) + anchorCorrection.y;
    element.style.left = roundValue(this.extendedItem, left) + 'px';
    element.style.top = roundValue(this.extendedItem, top) + 'px';
  }

  private prepareResize(designItem: IDesignItem, mode: string) {
    let top: string | null = null;
    let bottom: string | null = null;
    let left: string | null = null;
    let right: string | null = null;

    switch (this._actionModeStarted) {
      case 'e-resize':
        left = getComputedStyle(designItem.element).left;
        (<HTMLElement>designItem.element).style.removeProperty('right');
        (<HTMLElement>designItem.element).style.left = left;
        //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
        break;
      case 'se-resize':
        top = getComputedStyle(designItem.element).top;
        (<HTMLElement>designItem.element).style.removeProperty('bottom');
        (<HTMLElement>designItem.element).style.top = top;
        left = getComputedStyle(designItem.element).left;
        (<HTMLElement>designItem.element).style.removeProperty('right');
        (<HTMLElement>designItem.element).style.left = left;
        //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
        break;
      case 's-resize':
        top = getComputedStyle(designItem.element).top;
        (<HTMLElement>designItem.element).style.removeProperty('bottom');
        (<HTMLElement>designItem.element).style.top = top;
        //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + this._initialComputedTransformOrigins[i].y + 'px';
        break;
      case 'sw-resize':
        top = getComputedStyle(designItem.element).top;
        (<HTMLElement>designItem.element).style.removeProperty('bottom');
        (<HTMLElement>designItem.element).style.top = top;
        right = getComputedStyle(designItem.element).right;
        (<HTMLElement>designItem.element).style.removeProperty('left');
        (<HTMLElement>designItem.element).style.right = right;
        //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
        break;
      case 'w-resize':
        right = getComputedStyle(designItem.element).right;
        (<HTMLElement>designItem.element).style.removeProperty('left');
        (<HTMLElement>designItem.element).style.right = right;
        //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + this._initialComputedTransformOrigins[i].y + 'px';
        break;
      case 'nw-resize':
        bottom = getComputedStyle(designItem.element).bottom;
        (<HTMLElement>designItem.element).style.removeProperty('top');
        (<HTMLElement>designItem.element).style.bottom = bottom;
        right = getComputedStyle(designItem.element).right;
        (<HTMLElement>designItem.element).style.removeProperty('left');
        (<HTMLElement>designItem.element).style.right = right;
        //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
        break;
      case 'n-resize':
        bottom = getComputedStyle(designItem.element).bottom;
        (<HTMLElement>designItem.element).style.removeProperty('top');
        (<HTMLElement>designItem.element).style.bottom = bottom;
        //(<HTMLElement>designItem.element).style.transformOrigin = 'calc(100% - ' + this._initialComputedTransformOrigins[i].x + 'px) ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
        break;
      case 'ne-resize':
        bottom = getComputedStyle(designItem.element).bottom;
        (<HTMLElement>designItem.element).style.removeProperty('top');
        (<HTMLElement>designItem.element).style.bottom = bottom;
        left = getComputedStyle(designItem.element).left;
        (<HTMLElement>designItem.element).style.removeProperty('right');
        (<HTMLElement>designItem.element).style.left = left;
        //(<HTMLElement>designItem.element).style.transformOrigin = this._initialComputedTransformOrigins[i].x + 'px ' + 'calc(100% - ' + this._initialComputedTransformOrigins[i].y + 'px)';
        break;
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}
