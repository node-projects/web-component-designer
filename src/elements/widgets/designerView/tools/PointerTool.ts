import { EventNames } from "../../../../enums/EventNames";
import { PointerActionType } from "../../../../enums/PointerActionType";
import { IPoint } from "../../../../interfaces/IPoint";
import { DesignItem } from "../../../item/DesignItem";
import { IDesignItem } from "../../../item/IDesignItem";
import { IPlacementService } from "../../../services/placementService/IPlacementService";
import { ExtensionType } from "../extensions/ExtensionType";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { ITool } from "./ITool";
import { NamedTools } from './NamedTools';
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper';

export class PointerTool implements ITool {

  readonly cursor: string = 'default';

  private _movedSinceStartedAction: boolean = false;
  private _initialPoint: IPoint;
  private _actionType?: PointerActionType;
  private _actionStartedDesignItem?: IDesignItem;

  private _previousEventName: EventNames;

  private _clickThroughElements: [designItem: IDesignItem, backupPointerEvents: string][] = []

  private _dragOverExtensionItem: IDesignItem;
  private _dragExtensionItem: IDesignItem;

  private _moveItemsOffset: IPoint = { x: 0, y: 0 };
  private _initialOffset: IPoint;

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  private _showContextMenu(event: MouseEvent, designerCanvas : IDesignerCanvas) {
    event.preventDefault();
    if (!event.shiftKey) {
      let items = designerCanvas.getItemsBelowMouse(event);
      if (items.indexOf(designerCanvas.instanceServiceContainer.selectionService.primarySelection?.element) >= 0)
      designerCanvas.showDesignItemContextMenu(designerCanvas.instanceServiceContainer.selectionService.primarySelection, event);
      else {
        const designItem = DesignItem.GetOrCreateDesignItem(<Node>event.target, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        if (!designerCanvas.instanceServiceContainer.selectionService.isSelected(designItem)) {
          designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([designItem]);
        }
        designerCanvas.showDesignItemContextMenu(designItem, event);
      }
    }
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (event.button == 2){
      this._showContextMenu(event, designerCanvas)
      return;
    }

    if (((event.ctrlKey || event.metaKey) && event.shiftKey) || event.buttons == 4) {
      const panTool = designerCanvas.serviceContainer.designerTools.get(NamedTools.Pan);
      if (panTool) {
        panTool.pointerEventHandler(designerCanvas, event, currentElement);
        return;
      }
    }
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

    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);

    if (this._actionType == null) {
      this._initialPoint = currentPoint;
      this._initialOffset = designerCanvas.getNormalizedOffsetInElement(event, currentElement);
      if (event.type == EventNames.PointerDown) {
        this._actionStartedDesignItem = currentDesignItem;
        designerCanvas.snapLines.clearSnaplines();
        if (currentDesignItem !== designerCanvas.rootDesignItem) {
          this._actionType = PointerActionType.Drag;
        } else if (currentElement === <any>designerCanvas || currentElement === designerCanvas.rootDesignItem.element || currentElement == null) {
          designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
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
      this._pointerActionTypeDrawSelection(designerCanvas, event, (<HTMLElement>currentElement));
    } else if (this._actionType == PointerActionType.DragOrSelect || this._actionType == PointerActionType.Drag) {
      this._pointerActionTypeDragOrSelect(designerCanvas, event, currentDesignItem, currentPoint);
    }
    if (event.type == EventNames.PointerUp) {
      designerCanvas.snapLines.clearSnaplines();
      if (this._actionType == PointerActionType.DrawSelection) {
        if (currentDesignItem !== designerCanvas.rootDesignItem)
          designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
      }
      this._actionType = null;
      this._actionStartedDesignItem = null;
      this._movedSinceStartedAction = false;
      this._initialPoint = null;
    }

    this._previousEventName = <EventNames>event.type;
  }

  private _pointerActionTypeDrawSelection(designerView: IDesignerCanvas, event: PointerEvent, currentElement: HTMLElement) {
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

  private _pointerActionTypeDragOrSelect(designerCanvas: IDesignerCanvas, event: PointerEvent, currentDesignItem: IDesignItem, currentPoint: IPoint) {
    if (event.altKey) {
      if (event.type == EventNames.PointerDown) {
        this._clickThroughElements.push([currentDesignItem, (<HTMLElement>currentDesignItem.element).style.pointerEvents]);
        (<HTMLElement>currentDesignItem.element).style.pointerEvents = 'none';
      }
      let currentElement = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
      if (DomHelper.getHost(currentElement) !== designerCanvas.overlayLayer)
        currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
    } else {
      this._resetPointerEventsForClickThrough();
    }

    switch (event.type) {
      case EventNames.PointerDown:
        {
          this._actionStartedDesignItem = currentDesignItem;
          this._moveItemsOffset = { x: 0, y: 0 };

          if (event.shiftKey || event.ctrlKey) {
            const index = designerCanvas.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem);
            if (index >= 0) {
              let newSelectedList = designerCanvas.instanceServiceContainer.selectionService.selectedElements.slice(0);
              newSelectedList.splice(index, 1);
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
            }
            else {
              let newSelectedList = designerCanvas.instanceServiceContainer.selectionService.selectedElements.slice(0);
              newSelectedList.push(currentDesignItem);
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
            }
          } else {
            if (designerCanvas.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem) < 0)
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
          }
          if (designerCanvas.alignOnSnap)
            designerCanvas.snapLines.calculateSnaplines(designerCanvas.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
      case EventNames.PointerMove:
        {
          const elementMoved = currentPoint.x != this._initialPoint.x || currentPoint.y != this._initialPoint.y;
          if (this._actionType != PointerActionType.Drag && elementMoved) {
            this._actionType = PointerActionType.Drag;
          }

          if (this._movedSinceStartedAction) {
            const containerStyle = getComputedStyle(this._actionStartedDesignItem.parent.element);
            const currentContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent, containerStyle));
            if (currentContainerService) {
              const dragItem = this._actionStartedDesignItem.parent;
              if (this._dragExtensionItem != dragItem) {
                designerCanvas.extensionManager.removeExtension(this._dragExtensionItem, ExtensionType.ContainerDrag);
                designerCanvas.extensionManager.applyExtension(dragItem, ExtensionType.ContainerDrag);
                this._dragExtensionItem = dragItem;
              }
              else {
                designerCanvas.extensionManager.refreshExtension(dragItem, ExtensionType.ContainerDrag);
              }

              const canLeave = currentContainerService.canLeave(this._actionStartedDesignItem.parent, [this._actionStartedDesignItem]);

              let newContainerElementDesignItem: IDesignItem = null;
              let newContainerService: IPlacementService = null;

              if (canLeave) {
                //search for containers below mouse cursor.
                //to do this, we need to disable pointer events for each in a loop and search wich element is there
                let backupPEventsMap: Map<HTMLElement, string> = new Map();
                let newContainerElement = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
                try {
                  checkAgain: while (newContainerElement != null) {
                    if (newContainerElement == this._actionStartedDesignItem.parent.element) {
                      newContainerElement = null;
                    } else if (newContainerElement == designerCanvas.rootDesignItem.element) {
                      newContainerElementDesignItem = designerCanvas.rootDesignItem;
                      const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
                      newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
                      break;
                    } else if (newContainerElement.getRootNode() !== designerCanvas.shadowRoot || <any>newContainerElement === designerCanvas.overlayLayer || <any>newContainerElement.parentElement === designerCanvas.overlayLayer) {
                      backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                      newContainerElement.style.pointerEvents = 'none';
                      const old = newContainerElement;
                      newContainerElement = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
                      if (old === newContainerElement) {
                        newContainerElementDesignItem = null;
                        newContainerService = null;
                        break;
                      }
                    }
                    else if (newContainerElement == this._actionStartedDesignItem.element) {
                      backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                      newContainerElement.style.pointerEvents = 'none';
                      const old = newContainerElement;
                      newContainerElement = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
                      if (old === newContainerElement) {
                        newContainerElementDesignItem = null;
                        newContainerService = null;
                        break;
                      }
                    }
                    else {
                      //check we don't try to move a item over one of its children...
                      let par = newContainerElement.parentElement;
                      while (par) {
                        if (par == this._actionStartedDesignItem.element) {
                          backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                          newContainerElement.style.pointerEvents = 'none';
                          const old = newContainerElement;
                          newContainerElement = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
                          if (old === newContainerElement)
                            break;
                          continue checkAgain;
                        }
                        par = par.parentElement;
                      }
                      //end check
                      newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(newContainerElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
                      const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
                      newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
                      if (newContainerService) {
                        if (newContainerService.canEnter(newContainerElementDesignItem, [this._actionStartedDesignItem])) {
                          break;
                        } else {
                          newContainerElementDesignItem = null;
                          newContainerService = null;
                        }
                      }
                      backupPEventsMap.set(newContainerElement, newContainerElement.style.pointerEvents);
                      newContainerElement.style.pointerEvents = 'none';
                      const newC = designerCanvas.elementFromPoint(event.x, event.y) as HTMLElement;
                      if (newContainerElement === newC) {
                        newContainerElement = null;
                        break;
                      }
                      newContainerElement = newC;
                    }
                  }
                }
                finally {
                  for (let e of backupPEventsMap.entries()) {
                    e[0].style.pointerEvents = e[1];
                  }
                }

                if (newContainerElement != null) { //Check if container is in designer canvas....
                  let p = newContainerElement
                  while (p != null) {
                    if (p === designerCanvas.rootDesignItem.element)
                      break;
                    p = p.parentElement;
                  }
                  if (p == null) {
                    newContainerService = null;
                    newContainerElement = null;
                  }
                }
                //if we found a new enterable container create extensions 
                if (newContainerElement != null) {
                  const newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(newContainerElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
                  if (this._dragOverExtensionItem != newContainerElementDesignItem) {
                    designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
                    designerCanvas.extensionManager.applyExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOver);
                    this._dragOverExtensionItem = newContainerElementDesignItem;
                  }
                  else {
                    designerCanvas.extensionManager.refreshExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOver);
                  }
                } else {
                  if (this._dragOverExtensionItem) {
                    designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
                    this._dragOverExtensionItem = null;
                  }
                }
              }

              if (newContainerService && event.altKey) {
                //TODO: all items, fix position
                const oldOffset = currentContainerService.getElementOffset(this._actionStartedDesignItem.parent, this._actionStartedDesignItem);
                const newOffset = newContainerService.getElementOffset(newContainerElementDesignItem, this._actionStartedDesignItem);
                this._moveItemsOffset = { x: newOffset.x - oldOffset.x + this._moveItemsOffset.x, y: newOffset.y - oldOffset.y + this._moveItemsOffset.y };
                currentContainerService.leaveContainer(this._actionStartedDesignItem.parent, [this._actionStartedDesignItem]);
                newContainerElementDesignItem._insertChildInternal(this._actionStartedDesignItem);

                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                newContainerService.enterContainer(newContainerElementDesignItem, [this._actionStartedDesignItem]);
                newContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
              } else {
                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                currentContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
              }
              designerCanvas.extensionManager.refreshExtensions(designerCanvas.instanceServiceContainer.selectionService.selectedElements);
            }
          }
          break;
        }
      case EventNames.PointerUp:
        {
          if (this._actionType == PointerActionType.DragOrSelect) {
            if (this._previousEventName == EventNames.PointerDown && !event.shiftKey && !event.ctrlKey)
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
            return;
          }

          if (this._movedSinceStartedAction) {
            const containerStyle = getComputedStyle(this._actionStartedDesignItem.parent.element);
            let containerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent, containerStyle))
            const cp = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };

            if (containerService) {
              let cg = designerCanvas.rootDesignItem.openGroup("Move Elements", designerCanvas.instanceServiceContainer.selectionService.selectedElements);
              containerService.finishPlace(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
              cg.commit();
            }

            designerCanvas.extensionManager.removeExtension(this._dragExtensionItem, ExtensionType.ContainerDrag);
            this._dragExtensionItem = null;
            designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOver);
            this._dragOverExtensionItem = null;
            this._moveItemsOffset = { x: 0, y: 0 };
          }

          designerCanvas.extensionManager.refreshExtensions(designerCanvas.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }
}