import { EventNames } from "../../../../enums/EventNames";
import { PointerActionType } from "../../../../enums/PointerActionType";
import { IDesignerMousePoint } from "../../../../interfaces/IDesignerMousePoint";
import { DesignItem } from "../../../item/DesignItem";
import { IDesignItem } from "../../../item/IDesignItem";
import { ExtensionType } from "../extensions/ExtensionType";
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

  private _dragOverExtensionItem: IDesignItem;
  private _dragExtensionItem: IDesignItem;

  constructor() {
  }

  dispose(): void {
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
        //let composedPath = event.composedPath();
        if (currentDesignItem !== designerView.rootDesignItem) {
          this._actionType = PointerActionType.Drag;
        } /*else if (composedPath && composedPath[0] === currentElement && (currentElement.children.length > 0 || (<HTMLElement>currentElement).innerText == '') &&
          (<HTMLElement>currentElement).style.background == '' && (currentElement.localName === 'div')) { // TODO: maybe check if some element in the composedPath till the designer div has a background. If not, selection mode
          designerView.instanceServiceContainer.selectionService.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
        }*/ else if (currentElement === <any>designerView || currentElement === designerView.rootDesignItem.element || currentElement == null) {
          designerView.instanceServiceContainer.selectionService.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
          //return;
        } else {
          this._actionType = PointerActionType.DragOrSelect;
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
    const drawSelectionTool = designerView.serviceContainer.designerTools.get(NamedTools.DrawSelection);
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

          if (this._movedSinceStartedAction) {
            const currentContainerService = designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent));
            if (currentContainerService.canLeave(this._actionStartedDesignItem.parent, [this._actionStartedDesignItem])) {
              const dragItem = this._actionStartedDesignItem.parent;
              if (this._dragExtensionItem != dragItem) {
                designerView.extensionManager.removeExtension(this._dragExtensionItem, ExtensionType.ContainerDrag);
                designerView.extensionManager.applyExtension(dragItem, ExtensionType.ContainerDrag);
                this._dragExtensionItem = dragItem;
              }
              else {
                designerView.extensionManager.refreshExtension(dragItem, ExtensionType.ContainerDrag);
              }

              //search for containers below mouse cursor.
              //to do this, we need to disable pointer events for each in a loop and search wich element is there
              let backupPEventsMap: Map<HTMLElement, string> = new Map();
              let newContainerElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
              try {
                checkAgain: while (newContainerElement != null) {
                  if (newContainerElement == this._actionStartedDesignItem.parent.element) {
                    newContainerElement = null;
                  } else if (newContainerElement == designerView.rootDesignItem.element) {
                    break;
                  } else if (<any>newContainerElement == designerView.overlayLayer || <any>newContainerElement.parentElement == designerView.overlayLayer) {
                    backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                    newContainerElement.style.pointerEvents = 'none';
                    newContainerElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
                  }
                  else if (newContainerElement == this._actionStartedDesignItem.element) {
                    backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                    newContainerElement.style.pointerEvents = 'none';
                    newContainerElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
                  }
                  else {
                    //check we don't try to move a item over one of its children...
                    let par = newContainerElement.parentElement;
                    while (par) {
                      if (par == this._actionStartedDesignItem.element) {
                        backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                        newContainerElement.style.pointerEvents = 'none';
                        newContainerElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
                        continue checkAgain;
                      }
                      par = par.parentElement;
                    }
                    //end check
                    const newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(newContainerElement, designerView.serviceContainer, designerView.instanceServiceContainer);
                    const newContainerService = designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem));
                    if (newContainerService && newContainerService.canEnter(newContainerElementDesignItem,[this._actionStartedDesignItem]))
                      break;
                    backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                    newContainerElement.style.pointerEvents = 'none';
                    newContainerElement = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
                  }
                }
              }
              finally {
                for (let e of backupPEventsMap.entries()) {
                  e[0].style.pointerEvents = e[1];
                }
              }

              //if we found a new enterable container create extensions 
              if (newContainerElement != null) {
                const newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(newContainerElement, designerView.serviceContainer, designerView.instanceServiceContainer);
                if (this._dragOverExtensionItem != newContainerElementDesignItem) {
                  designerView.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
                  designerView.extensionManager.applyExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOver);
                  this._dragOverExtensionItem = newContainerElementDesignItem;
                }
                else {
                  designerView.extensionManager.refreshExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOver);
                }
              } else {
                if (this._dragOverExtensionItem) {
                  designerView.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
                  this._dragOverExtensionItem = null;
                }
              }

              const containerService = designerView.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent));
              containerService.place(event, designerView, this._actionStartedDesignItem.parent, this._initialPoint, currentPoint, designerView.instanceServiceContainer.selectionService.selectedElements);
              designerView.extensionManager.refreshExtensions(designerView.instanceServiceContainer.selectionService.selectedElements);
            }
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

            designerView.extensionManager.removeExtension(this._dragExtensionItem, ExtensionType.ContainerDrag);
            this._dragExtensionItem = null;
            designerView.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
            this._dragOverExtensionItem = null;
          }

          designerView.extensionManager.refreshExtensions(designerView.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
    }
  }
}