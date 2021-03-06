import { EventNames } from "../../../../enums/EventNames";
import { IDesignerMousePoint } from "../../../../interfaces/IDesignerMousePoint";
import { ISize } from "../../../../interfaces/ISize";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IPlacementView } from "../IPlacementView";
import { AbstractExtension } from './AbstractExtension';
import { IExtensionManager } from "./IExtensionManger";

export class ResizeExtension extends AbstractExtension {

  private resizeAllSelected: boolean;
  private _initialSizes: ISize[];
  private _actionModeStarted: string;
  private _initialPoint: IDesignerMousePoint;
  private _circle1: SVGCircleElement;
  private _circle2: SVGCircleElement;
  private _circle3: SVGCircleElement;
  private _circle4: SVGCircleElement;
  private _circle5: SVGCircleElement;
  private _circle6: SVGCircleElement;
  private _circle7: SVGCircleElement;
  private _circle8: SVGCircleElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem, resizeAllSelected: boolean) {
    super(extensionManager, designerView, extendedItem);
    this.resizeAllSelected = resizeAllSelected;
  }

  override extend() {
  }

  override refresh() {
    const rect = this.extendedItem.element.getBoundingClientRect();
    this._circle1 = this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'nw-resize', this._circle1);
    this._circle2 = this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'n-resize', this._circle2);
    this._circle3 = this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'ne-resize', this._circle3);
    this._circle4 = this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'sw-resize', this._circle4);
    this._circle5 = this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 's-resize', this._circle5);
    this._circle6 = this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'se-resize', this._circle6);
    this._circle7 = this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'w-resize', this._circle7);
    this._circle8 = this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'e-resize', this._circle8);
    if (rect.width < 12) {
      this._circle2.style.display = 'none';
      this._circle5.style.display = 'none';
    } else {
      this._circle2.style.display = '';
      this._circle5.style.display = '';
    }
    if (rect.height < 12) {
      this._circle7.style.display = 'none';
      this._circle8.style.display = 'none';
    } else {
      this._circle8.style.display = '';
      this._circle8.style.display = '';
    }
  }


  _drawResizerOverlay(x: number, y: number, cursor: string, oldCircle?: SVGCircleElement): SVGCircleElement {
    let circle = this._drawCircleOverlay(x, y, 3, 'svg-primary-resizer', oldCircle);
    if (!oldCircle) {
      circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(event, cursor));
      circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(event, cursor));
      circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(event, cursor));
    }
    circle.setAttribute('style', 'cursor: ' + cursor);
    return circle;
  }

  _pointerActionTypeResize(event: PointerEvent, actionMode: string = 'se-resize') {
    event.stopPropagation();
    const currentPoint = this.designerView.getDesignerMousepoint(event, this.extendedItem.element, event.type === 'pointerdown' ? null : this._initialPoint);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._initialPoint = currentPoint;
        this._initialSizes = [];
        this._actionModeStarted = actionMode;
        for (const designItem of this.designerView.instanceServiceContainer.selectionService.selectedElements) {
          let rect = designItem.element.getBoundingClientRect();
          this._initialSizes.push({ width: rect.width, height: rect.height });
        }
        if (this.designerView.alignOnSnap)
          this.designerView.snapLines.calculateSnaplines(this.designerView.instanceServiceContainer.selectionService.selectedElements);
        break;

      case EventNames.PointerMove:
        if (this._initialPoint) {
          this._initialPoint.offsetInControlX = 0;
          this._initialPoint.offsetInControlY = 0;
          const containerService = this.designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.extendedItem.parent))

          const diff = containerService.placePoint(event, <IPlacementView><any>this.designerView, this.extendedItem.parent, this._initialPoint, currentPoint, this.designerView.instanceServiceContainer.selectionService.selectedElements);

          let trackX = diff.x - this._initialPoint.x;
          let trackY = diff.y - this._initialPoint.y;

          let i = 0;

          switch (this._actionModeStarted) {
            case 'se-resize':
              (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width + trackX + 'px';
              (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height + trackY + 'px';
              if (this.resizeAllSelected) {
                for (const designItem of this.designerView.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + trackX + 'px';
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + trackY + 'px';
                  }
                }
              }
              break;
            case 's-resize':
              (<HTMLElement>this.extendedItem.element).style.height = this._initialSizes[i].height + trackY + 'px';
              if (this.resizeAllSelected) {
                for (const designItem of this.designerView.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + trackY + 'px';
                  }
                }
              }
              break;
            case 'e-resize':
              (<HTMLElement>this.extendedItem.element).style.width = this._initialSizes[i].width + trackX + 'px';
              if (this.resizeAllSelected) {
                for (const designItem of this.designerView.instanceServiceContainer.selectionService.selectedElements) {
                  if (designItem !== this.extendedItem) {
                    (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + trackX + 'px';
                  }
                }
              }
              break;
            //for other resize modes we need a replacement
          }

          this.extensionManager.refreshExtensions(this.designerView.instanceServiceContainer.selectionService.selectedElements);
        }
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        let cg = this.extendedItem.openGroup("Resize Elements", this.designerView.instanceServiceContainer.selectionService.selectedElements);
        this.extendedItem.setStyle('width', (<HTMLElement>this.extendedItem.element).style.width);
        this.extendedItem.setStyle('height', (<HTMLElement>this.extendedItem.element).style.height);
        if (this.resizeAllSelected) {
          for (const designItem of this.designerView.instanceServiceContainer.selectionService.selectedElements) {
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