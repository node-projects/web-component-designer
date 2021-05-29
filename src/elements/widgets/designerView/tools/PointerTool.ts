import { EventNames } from "../../../../enums/EventNames";
import { PointerActionType } from "../../../../enums/PointerActionType";
import { IDesignerMousePoint } from "../../../../interfaces/IDesignerMousePoint";
import { DesignItem } from "../../../item/DesignItem";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { ITool } from "./ITool";
import { NamedTools } from './NamedTools';

export class PointerTool implements ITool {

  readonly cursor: string = 'default';

  private _movedSinceStartedAction: boolean = false;
  private _initialPoint: IDesignerMousePoint;
  private _actionType?: PointerActionType;
  private _actionStartedDesignItem?: IDesignItem;

  private _previousEventName: EventNames;

  private _clickThroughElements: [designItem: IDesignItem, backupPointerEvents: string][] = []

  constructor() {
  }

  dispose(): void {
    throw new Error("Method not implemented.");
  }

  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element) {
    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._movedSinceStartedAction = false;
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        break;
    }

    if (!event.altKey)
      this._resetPointerEventsForClickThrough();

    if (!currentElement)
      return;

    const currentPoint = designerView.getDesignerMousepoint(event, currentElement, event.type === 'pointerdown' ? null : this._initialPoint);
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerView.serviceContainer, designerView.instanceServiceContainer);

    if (this._actionType == null) {
      this._initialPoint = currentPoint;
      if (event.type == EventNames.PointerDown) {
        this._actionStartedDesignItem = currentDesignItem;
        designerView.snapLines.clearSnaplines();
        let composedPath = event.composedPath();
        if (currentDesignItem !== designerView.rootDesignItem /*&& forcedAction == PointerActionType.Drag*/) {
          this._actionType = PointerActionType.Drag;
        } else if (composedPath && composedPath[0] === currentElement && (currentElement.children.length > 0 || (<HTMLElement>currentElement).innerText == '') &&
          (<HTMLElement>currentElement).style.background == '' && (currentElement.localName === 'div')) { // TODO: maybe check if some element in the composedPath till the designer div has a background. If not, selection mode
          designerView.instanceServiceContainer.selectionService.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
        } else if (currentElement === <any>designerView || currentElement === designerView.rootDesignItem.element || currentElement == null) {
          designerView.instanceServiceContainer.selectionService.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
          return;
        } else {
          this._actionType = /*forcedAction ??*/ PointerActionType.DragOrSelect;
        }
      }
    }

    if (event.type === EventNames.PointerMove) {
      this._movedSinceStartedAction = this._movedSinceStartedAction || currentPoint.x != this._initialPoint.x || currentPoint.y != this._initialPoint.y;
      if (this._actionType == PointerActionType.DrawSelection)
        this._actionType = PointerActionType.DrawingSelection;
    }

    if (this._actionType == PointerActionType.DrawSelection || this._actionType == PointerActionType.DrawingSelection) {
      this._pointerActionTypeDrawSelection(designerView, event, (<HTMLElement>currentElement));
      //} else if (this._actionType == PointerActionType.Resize) {
      //  this._pointerActionTypeResize(event, (<HTMLElement>currentElement), currentPoint, actionMode);
      //} else if (this._actionType == PointerActionType.Rotate) {
      //  this._pointerActionTypeRotate(event, (<HTMLElement>currentElement), currentPoint, actionMode);
    } else if (this._actionType == PointerActionType.DragOrSelect || this._actionType == PointerActionType.Drag) {
      this._pointerActionTypeDragOrSelect(designerView, event, currentDesignItem, currentPoint);
    }
    if (event.type == EventNames.PointerUp) {
      designerView.snapLines.clearSnaplines();
      if (this._actionType == PointerActionType.DrawSelection) {
        if (currentDesignItem !== designerView.rootDesignItem)
          designerView.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
      }
      this._actionType = null;
      this._actionStartedDesignItem = null;
      this._movedSinceStartedAction = false;
      this._initialPoint = null;
    }

    this._previousEventName = <EventNames>event.type;
  }

  private _pointerActionTypeDrawSelection(designerView: IDesignerView, event: PointerEvent, currentElement: HTMLElement) {
    const drawSelectionTool = designerView.serviceContainer.designerTools.get(NamedTools.DrawSelectionTool);
    if (drawSelectionTool) {
      drawSelectionTool.pointerEventHandler(designerView, event, currentElement);
    }
  }


  private _resetPointerEventsForClickThrough() {
    if (!this._clickThroughElements.length)
      return;
    for (const e of this._clickThroughElements) {
      (<HTMLElement>e[0].element).style.pointerEvents = e[1];
    }
    this._clickThroughElements = [];
  }

  private _pointerActionTypeDragOrSelect(designerView: IDesignerView, event: PointerEvent, currentDesignItem: IDesignItem, currentPoint: IDesignerMousePoint) {
    if (event.altKey) {
      if (event.type == EventNames.PointerDown) {
        this._clickThroughElements.push([currentDesignItem, (<HTMLElement>currentDesignItem.element).style.pointerEvents]);
        (<HTMLElement>currentDesignItem.element).style.pointerEvents = 'none';
      }
      let currentElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
      if (currentElement.parentNode !== designerView.overlayLayer)
        currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerView.serviceContainer, designerView.instanceServiceContainer);
    } else {
      this._resetPointerEventsForClickThrough();
    }

    switch (event.type) {
      case EventNames.PointerDown:
        {
          this._actionStartedDesignItem = currentDesignItem;

          //this._dropTarget = null;
          if (event.shiftKey || event.ctrlKey) {
            const index = designerView.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem);
            if (index >= 0) {
              let newSelectedList = designerView.instanceServiceContainer.selectionService.selectedElements.slice(0);
              newSelectedList.splice(index, 1);
              designerView.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
            }
            else {
              let newSelectedList = designerView.instanceServiceContainer.selectionService.selectedElements.slice(0);
              newSelectedList.push(currentDesignItem);
              designerView.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
            }
          } else {
            if (designerView.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem) < 0)
              designerView.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
          }
          if (designerView.alignOnSnap)
            designerView.snapLines.calculateSnaplines(designerView.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
      case EventNames.PointerMove:
        {
          const elementMoved = currentPoint.x != this._initialPoint.x || currentPoint.y != this._initialPoint.y;
          if (this._actionType != PointerActionType.Drag && elementMoved) {
            this._actionType = PointerActionType.Drag;
          }

          //if (this._actionType != PointerActionType.Drag)
          //  return;

          if (this._movedSinceStartedAction) {
            const containerService = designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent))
            containerService.place(event, designerView, this._actionStartedDesignItem.parent, this._initialPoint, currentPoint, designerView.instanceServiceContainer.selectionService.selectedElements);
            designerView.extensionManager.refreshExtensions(designerView.instanceServiceContainer.selectionService.selectedElements);
          }
          break;
        }
      case EventNames.PointerUp:
        {
          if (this._actionType == PointerActionType.DragOrSelect) {
            if (this._previousEventName == EventNames.PointerDown && !event.shiftKey && !event.ctrlKey)
              designerView.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
            return;
          }

          if (this._movedSinceStartedAction) {
            let cg = designerView.rootDesignItem.openGroup("Move Elements", designerView.instanceServiceContainer.selectionService.selectedElements);
            let containerService = designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent))
            containerService.finishPlace(event, designerView, this._actionStartedDesignItem.parent, this._initialPoint, currentPoint, designerView.instanceServiceContainer.selectionService.selectedElements);
            cg.commit();
          }

          designerView.extensionManager.refreshExtensions(designerView.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
    }
  }
}