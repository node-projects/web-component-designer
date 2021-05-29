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

  constructor(extensionManager: IExtensionManager, designerView: IDesignerView, extendedItem: IDesignItem, resizeAllSelected: boolean) {
    super(extensionManager, designerView, extendedItem);
    this.resizeAllSelected = resizeAllSelected;
  }

  override extend() {
    const rect = this.extendedItem.element.getBoundingClientRect();
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'nw-resize');
    this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'n-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y - this.designerView.containerBoundingRect.y, 'ne-resize');
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'sw-resize');
    this._drawResizerOverlay(rect.x + (rect.width / 2) - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 's-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + rect.height - this.designerView.containerBoundingRect.y, 'se-resize');
    this._drawResizerOverlay(rect.x - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'w-resize');
    this._drawResizerOverlay(rect.x + rect.width - this.designerView.containerBoundingRect.x, rect.y + (rect.height / 2) - this.designerView.containerBoundingRect.y, 'e-resize');
  }

  _drawResizerOverlay(x: number, y: number, cursor: string) {
    const circle = this._drawCircleOverlay(x, y, 3, 'svg-primary-resizer');
    circle.setAttribute('style', 'cursor: ' + cursor);
    circle.addEventListener(EventNames.PointerDown, event => this._pointerActionTypeResize(event, cursor));
    circle.addEventListener(EventNames.PointerMove, event => this._pointerActionTypeResize(event, cursor));
    circle.addEventListener(EventNames.PointerUp, event => this._pointerActionTypeResize(event, cursor));
  }

  _pointerActionTypeResize(event: MouseEvent, actionMode: string = 'se-resize') {
    const currentPoint = this.designerView.getDesignerMousepoint(event, this.extendedItem.element, event.type === 'pointerdown' ? null : this._initialPoint);

    switch (event.type) {
      case EventNames.PointerDown:
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

        this._initialPoint.controlOffsetX = 0;
        this._initialPoint.controlOffsetY = 0;
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
        break;

      case EventNames.PointerUp:
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
        break;
    }
  }

  override refresh() {
    this._removeAllOverlays();
    this.extend();
  }

  override dispose() {
    this._removeAllOverlays();
  }
}