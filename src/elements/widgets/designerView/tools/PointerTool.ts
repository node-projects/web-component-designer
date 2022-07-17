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

export class PointerTool implements ITool {

  readonly cursor: string = 'default';

  private _movedSinceStartedAction: boolean = false;
  private _initialPoint: IPoint;
  private _actionType?: PointerActionType;
  private _actionStartedDesignItem?: IDesignItem;
  private _actionStartedDesignItems?: IDesignItem[];

  private _previousEventName: EventNames;

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

  private _showContextMenu(event: MouseEvent, designerCanvas: IDesignerCanvas) {
    event.preventDefault();
    if (!event.shiftKey) {
      let items = designerCanvas.elementsFromPoint(event.x, event.y);
      for (let e of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        if (items.indexOf(e.element) >= 0) {
          designerCanvas.showDesignItemContextMenu(designerCanvas.instanceServiceContainer.selectionService.primarySelection, event);
          return;
        }
      }
      const designItem = DesignItem.GetOrCreateDesignItem(<Node>event.target, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
      if (!designerCanvas.instanceServiceContainer.selectionService.isSelected(designItem)) {
        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([designItem]);
      }
      designerCanvas.showDesignItemContextMenu(designItem, event);
    }
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const interactionServices = designerCanvas.serviceContainer.elementInteractionServices;
    if (interactionServices)
      for (let s of interactionServices) {
        if (s.stopEventHandling(designerCanvas, event, currentElement))
          return;
      }

    if (event.button == 2) {
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
        designerCanvas.captureActiveTool(this);
        this._movedSinceStartedAction = false;
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();
        break;
    }

    if (!currentElement)
      return;

    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);

    if (this._actionType == null) {
      this._initialPoint = currentPoint;
      this._initialOffset = designerCanvas.getNormalizedOffsetInElement(event, currentElement);
      if (event.type == EventNames.PointerDown) {
        this._actionStartedDesignItem = currentDesignItem;
        this._actionStartedDesignItems = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];
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
      this._resetTool();
    }

    this._previousEventName = <EventNames>event.type;
  }

  private _resetTool() {
    this._actionType = null;
    this._actionStartedDesignItem = null;
    this._actionStartedDesignItems = null;
    this._movedSinceStartedAction = false;
    this._initialPoint = null;
  }

  private _pointerActionTypeDrawSelection(designerView: IDesignerCanvas, event: PointerEvent, currentElement: HTMLElement) {
    const drawSelectionTool = designerView.serviceContainer.designerTools.get(NamedTools.DrawSelection);
    if (drawSelectionTool) {
      this._resetTool();
      drawSelectionTool.pointerEventHandler(designerView, event, currentElement);
    }
  }

  private _pointerActionTypeDragOrSelect(designerCanvas: IDesignerCanvas, event: PointerEvent, currentDesignItem: IDesignItem, currentPoint: IPoint) {
    if (event.altKey) {
      if (event.type == EventNames.PointerDown) {
        const currentSelection = designerCanvas.instanceServiceContainer.selectionService.primarySelection;
        if (currentSelection) {
          const elements = designerCanvas.elementsFromPoint(event.x, event.y);
          let idx = elements.indexOf(currentSelection.element);
          if (idx >= 0) {
            idx++;
          }
          let currentElement = elements[idx];
          if (currentElement)
            currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        }
      }
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

          this._actionStartedDesignItems = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];

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

              const canLeave = currentContainerService.canLeave(this._actionStartedDesignItem.parent, this._actionStartedDesignItems);

              let newContainerElementDesignItem: IDesignItem = null;
              let newContainerService: IPlacementService = null;

              if (canLeave) {
                [newContainerElementDesignItem, newContainerService] = PointerTool.FindPossibleContainer(this._actionStartedDesignItem, this._actionStartedDesignItems, event);

                //if we found a new enterable container create extensions 
                if (newContainerElementDesignItem != null) {
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
                currentContainerService.leaveContainer(this._actionStartedDesignItem.parent, this._actionStartedDesignItems);
                for (let di of this._actionStartedDesignItems)
                  newContainerElementDesignItem._insertChildInternal(di); //todo -> maybe in enter container???

                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                newContainerService.enterContainer(newContainerElementDesignItem, this._actionStartedDesignItems);
                newContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, this._actionStartedDesignItems);
              } else {
                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                currentContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, this._actionStartedDesignItems);
              }
              designerCanvas.extensionManager.refreshExtensions(this._actionStartedDesignItems);
            }
          }
          break;
        }
      case EventNames.PointerUp:
        {
          if (!this._movedSinceStartedAction || this._actionType == PointerActionType.DragOrSelect) {
            if (this._previousEventName == EventNames.PointerDown && !event.shiftKey && !event.ctrlKey)
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([this._actionStartedDesignItem]);
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

  static FindPossibleContainer(designItem: IDesignItem, designItems: IDesignItem[], event: IPoint): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
    let newContainerElementDesignItem: IDesignItem = null;
    let newContainerService: IPlacementService = null;

    const designerCanvas = designItem.instanceServiceContainer.designerCanvas;
    const elementsFromPoint = designerCanvas.elementsFromPoint(event.x, event.y);
    for (let e of elementsFromPoint) {
      if (e == designItem.element) {
        continue;
      } else if (e == designItem.parent.element) {
        break;
      } else if (e == designerCanvas.rootDesignItem.element) {
        newContainerElementDesignItem = designerCanvas.rootDesignItem;
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        break;
      } else if (false) {
        //check we don't try to move a item over one of its children..
      } else {
        newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        if (newContainerService) {
          if (newContainerService.canEnter(newContainerElementDesignItem, designItems)) {
            break;
          } else {
            newContainerElementDesignItem = null;
            newContainerService = null;
            continue;
          }
        }
      }
    }
    return [newContainerElementDesignItem, newContainerService];
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }
}