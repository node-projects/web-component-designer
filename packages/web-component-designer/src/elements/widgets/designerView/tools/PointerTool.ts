import { EventNames } from '../../../../enums/EventNames.js';
import { PointerActionType } from '../../../../enums/PointerActionType.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IPlacementService } from '../../../services/placementService/IPlacementService.js';
import { ExtensionType } from '../extensions/ExtensionType.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';
import { NamedTools } from './NamedTools.js';
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { ChangeGroup } from '../../../services/undoService/ChangeGroup.js';

export class PointerTool implements ITool {

  public cursor: string = 'default';

  private _minMoveOffset = 5;

  private _movedSinceStartedAction: boolean = false;
  private _initialPoint: IPoint;
  private _actionType?: PointerActionType;
  private _actionStartedDesignItem?: IDesignItem;
  private _actionStartedDesignItems?: IDesignItem[];
  private _clonedItems?: IDesignItem[];
  private _copiedItemsInserted = false;

  private _previousEventName: EventNames;

  private _dragOverExtensionItem: IDesignItem;
  private _dragParentExtensionItem: IDesignItem;

  private _moveItemsOffset: IPoint = { x: 0, y: 0 };
  private _initialOffset: IPoint;
  private _started: boolean = false;
  private _holdTimeout: any;

  private _firstTimeInMove: boolean;
  private _secondTimeInMove: boolean;
  private _changeGroup: ChangeGroup

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  private _showContextMenu(event: MouseEvent, designerCanvas: IDesignerCanvas) {
    event.preventDefault();
    if (!event.ctrlKey && !event.shiftKey) {
      let items = designerCanvas.elementsFromPoint(event.x, event.y);
      for (let e of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        if (items.indexOf(e.element) >= 0) {
          designerCanvas.showDesignItemContextMenu(designerCanvas.instanceServiceContainer.selectionService.primarySelection, event);
          return;
        }
      }
      let newEl = designerCanvas.serviceContainer.elementAtPointService.getElementAtPoint(designerCanvas, { x: event.x, y: event.y });
      const designItem = DesignItem.GetOrCreateDesignItem(newEl, newEl, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
      if (!designerCanvas.instanceServiceContainer.selectionService.isSelected(designItem)) {
        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([designItem], event);
      }

      designerCanvas.showDesignItemContextMenu(designItem, event);
    }
  }

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (event.ctrlKey || event.shiftKey)
      this.cursor = 'copy';
    else
      this.cursor = 'default';

    const interactionServices = designerCanvas.serviceContainer.elementInteractionServices;
    if (interactionServices)
      for (let s of interactionServices) {
        if (s.stopEventHandling(designerCanvas, event, currentElement))
          return;
      }

    if (event.button == 2 && event.type == EventNames.PointerDown) {
      this._showContextMenu(event, designerCanvas)
      return;
    }

    if (((event.ctrlKey || event.metaKey) && event.shiftKey) || event.buttons == 4) {
      const panTool = <ITool>designerCanvas.serviceContainer.designerTools.get(NamedTools.Pan);
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
        this._copiedItemsInserted = false;
        this._clonedItems = null;
        this._firstTimeInMove = false;
        this._secondTimeInMove = false;
        break;
      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();
        this._copiedItemsInserted = false;
        this._clonedItems = null;
        this._firstTimeInMove = false;
        this._secondTimeInMove = false;
        break;
      case EventNames.PointerMove:
        if (this._firstTimeInMove)
          this._secondTimeInMove = true;
        if (this._secondTimeInMove)
          this._firstTimeInMove = false;
        else
          this._firstTimeInMove = true;
        break;
    }

    if (!currentElement)
      return;

    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);

    if (this._actionType == null) {
      this._initialPoint = currentPoint;
      this._initialOffset = designerCanvas.getNormalizedOffsetInElement(event, currentElement);
      if (event.altKey) {
        this._actionType = PointerActionType.DrawSelection;
      } else if (event.type == EventNames.PointerDown) {
        this._actionStartedDesignItem = currentDesignItem;
        this._actionStartedDesignItems = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];
        designerCanvas.snapLines.clearSnaplines();
        if (currentDesignItem !== designerCanvas.rootDesignItem) {
          this._actionType = PointerActionType.Drag;
        } else if (currentElement === <any>designerCanvas || currentElement === designerCanvas.rootDesignItem.element || currentElement == null) {
          //if (!event.ctrlKey && !event.shiftKey)
          //  designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(null, event);
          this._actionType = PointerActionType.DrawSelection;
        } else {
          this._actionType = PointerActionType.DragOrSelect;
        }
      }
    }

    if (event.type === EventNames.PointerMove) {
      this._movedSinceStartedAction = this._movedSinceStartedAction || Math.abs(currentPoint.x - this._initialPoint.x) > this._minMoveOffset || Math.abs(currentPoint.y - this._initialPoint.y) > this._minMoveOffset;
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
          designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem], event);
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
    const drawSelectionTool = <ITool>designerView.serviceContainer.designerTools.get(NamedTools.DrawSelection);
    if (drawSelectionTool) {
      this._resetTool();
      drawSelectionTool.pointerEventHandler(designerView, event, currentElement);
    }
  }

  private async _pointerActionTypeDragOrSelect(designerCanvas: IDesignerCanvas, event: PointerEvent, currentDesignItem: IDesignItem, currentPoint: IPoint, raisedFromHold = false) {
    if (this._holdTimeout) {
      clearTimeout(this._holdTimeout);
      this._holdTimeout = null;
    }

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
            currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, currentElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        }
      }
    }

    switch (event.type) {
      case EventNames.PointerDown:
        {
          this._actionStartedDesignItem = currentDesignItem;

          this._moveItemsOffset = { x: 0, y: 0 };

          this._actionStartedDesignItems = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];

          if (designerCanvas.alignOnSnap)
            designerCanvas.snapLines.calculateSnaplines(designerCanvas.instanceServiceContainer.selectionService.selectedElements);

          break;
        }
      case EventNames.PointerMove:
        {

          if (event.buttons == 0) {
            return;
          }

          if (this._firstTimeInMove) {
            if (!currentDesignItem.instanceServiceContainer.selectionService.selectedElements.includes(currentDesignItem)) {
              if (event.ctrlKey || event.shiftKey)
                currentDesignItem.instanceServiceContainer.selectionService.setSelectedElements([...currentDesignItem.instanceServiceContainer.selectionService.selectedElements, currentDesignItem], event);
              else
                currentDesignItem.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem], event);
              this._actionStartedDesignItems = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];
              if (designerCanvas.alignOnSnap)
                designerCanvas.snapLines.calculateSnaplines(designerCanvas.instanceServiceContainer.selectionService.selectedElements);
            }
          }

          // *** Copy Items via Ctrl Drag ***

          if (!this._clonedItems) {
            this._clonedItems = [];
            for (let d of this._actionStartedDesignItems) {
              const clone = await d.clone();
              if (this._clonedItems && clone)
                this._clonedItems.push(clone);
            }
          }

          if (!this._actionStartedDesignItem)
            return;

          if (!this._changeGroup) {
            this._changeGroup = designerCanvas.rootDesignItem.openGroup("Move Elements");
            window.addEventListener('pointerup', () => { this._changeGroup?.abort(); this._changeGroup = null; }, { once: true });
          }

          if (event.ctrlKey && !this._copiedItemsInserted) {
            this._changeGroup.title = "Copy Elements";
            this._copiedItemsInserted = true;
            for (let i = 0; i < this._clonedItems.length; i++) {
              this._actionStartedDesignItems[i].insertAdjacentElement(this._clonedItems[i], 'beforebegin');
            }
            designerCanvas.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'added', designItems: this._clonedItems });
          } else if (!event.ctrlKey && this._copiedItemsInserted) {
            this._changeGroup.title = "Move Elements";
            for (let d of this._clonedItems) {
              d.remove();
            }
            this._copiedItemsInserted = false;
            designerCanvas.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'removed', designItems: this._clonedItems });
          }

          // *** End Copy Items Part ***

          const elementMoved = currentPoint.x != this._initialPoint.x || currentPoint.y != this._initialPoint.y;
          if (this._actionType != PointerActionType.Drag && elementMoved) {
            this._actionType = PointerActionType.Drag;
          }

          if (this._movedSinceStartedAction) {
            const containerStyle = getComputedStyle(this._actionStartedDesignItem.parent.element);
            const currentContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent, containerStyle, this._actionStartedDesignItem));
            if (currentContainerService) {
              const dragItem = this._actionStartedDesignItem.parent;
              if (this._dragParentExtensionItem != dragItem) {
                designerCanvas.extensionManager.removeExtension(this._dragParentExtensionItem, ExtensionType.ContainerDrag);
                designerCanvas.extensionManager.applyExtension(dragItem, ExtensionType.ContainerDrag, event);
                this._dragParentExtensionItem = dragItem;
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
                    designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOverAndCanBeEntered);
                    designerCanvas.extensionManager.applyExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOverAndCanBeEntered, event);
                    this._dragOverExtensionItem = newContainerElementDesignItem;
                  }
                  else {
                    designerCanvas.extensionManager.refreshExtension(newContainerElementDesignItem, ExtensionType.ContainerDragOverAndCanBeEntered, event);
                  }
                } else {
                  if (this._dragOverExtensionItem) {
                    designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOverAndCanBeEntered);
                    this._dragOverExtensionItem = null;
                  }
                }
              }

              if (newContainerService) {
                this._holdTimeout = setTimeout(() => {
                  this._pointerActionTypeDragOrSelect(designerCanvas, event, currentDesignItem, currentPoint, true);
                }, 1000);
              }

              if (newContainerService && (event.altKey || raisedFromHold)) {
                //TODO: all items, fix position
                const oldOffset = currentContainerService.getElementOffset(this._actionStartedDesignItem.parent, this._actionStartedDesignItem);
                const newOffset = newContainerService.getElementOffset(newContainerElementDesignItem, this._actionStartedDesignItem);
                this._moveItemsOffset = { x: newOffset.x - oldOffset.x + this._moveItemsOffset.x, y: newOffset.y - oldOffset.y + this._moveItemsOffset.y };
                currentContainerService.leaveContainer(this._actionStartedDesignItem.parent, this._actionStartedDesignItems);

                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                newContainerService.enterContainer(newContainerElementDesignItem, this._actionStartedDesignItems, 'normal');
                newContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, this._actionStartedDesignItems);

                designerCanvas.extensionManager.removeExtension(this._dragParentExtensionItem, ExtensionType.ContainerDrag);
                designerCanvas.extensionManager.applyExtension(newContainerElementDesignItem, ExtensionType.ContainerDrag, event);
                this._dragParentExtensionItem = newContainerElementDesignItem;
                designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOverAndCanBeEntered);
                this._dragOverExtensionItem = null;

                designerCanvas.extensionManager.refreshAllAppliedExtentions();
              } else {
                const cp: IPoint = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };
                if (!this._started) {
                  for (const item of this._actionStartedDesignItems) {
                    designerCanvas.extensionManager.removeExtension(item, ExtensionType.Placement);
                    designerCanvas.extensionManager.removeExtension(item, ExtensionType.MouseOver);
                    designerCanvas.extensionManager.applyExtension(item, ExtensionType.Placement, event);
                  }
                  currentContainerService.startPlace(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, this._actionStartedDesignItems);
                  this._started = true;
                }
                currentContainerService.place(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, this._actionStartedDesignItems);
              }
              designerCanvas.extensionManager.refreshExtensions(this._actionStartedDesignItems, null, event, null, 20);
            }
          }
          break;
        }
      case EventNames.PointerUp:
        {
          this._started = false;
          if (!this._movedSinceStartedAction || this._actionType == PointerActionType.DragOrSelect) {
            if (this._previousEventName == EventNames.PointerDown && !event.shiftKey && !event.ctrlKey) {
              designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([this._actionStartedDesignItem], event);
            } else {
              this.checkSelectElement(event, designerCanvas, currentDesignItem);
            }
            return;
          }

          if (this._movedSinceStartedAction) {
            const containerStyle = getComputedStyle(this._actionStartedDesignItem.parent.element);
            let containerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this._actionStartedDesignItem.parent, containerStyle, this._actionStartedDesignItem))
            const cp = { x: currentPoint.x - this._moveItemsOffset.x, y: currentPoint.y - this._moveItemsOffset.y };

            if (containerService) {
              if (!this._changeGroup)
                this._changeGroup = designerCanvas.rootDesignItem.openGroup("Move Elements");
              try {
                containerService.finishPlace(event, designerCanvas, this._actionStartedDesignItem.parent, this._initialPoint, this._initialOffset, cp, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
                this._changeGroup.commit();
                this._changeGroup = null;
              }
              catch (err) {
                console.error(err);
                this._changeGroup.abort();
              }
              this._changeGroup = null;
              let elements = designerCanvas.elementsFromPoint(event.x, event.y);
              for (const item of this._actionStartedDesignItems) {
                if (elements.includes(item.element))
                  designerCanvas.extensionManager.applyExtension(item, ExtensionType.MouseOver, event);
                designerCanvas.extensionManager.removeExtension(item, ExtensionType.Placement);
              }
            } else {
              if (this._changeGroup)
                this._changeGroup.abort();
              this._changeGroup = null;
            }

            designerCanvas.extensionManager.removeExtension(this._dragParentExtensionItem, ExtensionType.ContainerDrag);
            this._dragParentExtensionItem = null;
            designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerDragOverAndCanBeEntered);
            this._dragOverExtensionItem = null;
            this._moveItemsOffset = { x: 0, y: 0 };
          }

          designerCanvas.extensionManager.refreshExtensions(designerCanvas.instanceServiceContainer.selectionService.selectedElements, null, event, null, 20);

          if (this._changeGroup) {
            this._changeGroup.abort();
            this._changeGroup = null;
          }

          break;
        }
    }
  }

  private checkSelectElement(event: PointerEvent, designerCanvas: IDesignerCanvas, currentDesignItem: IDesignItem) {
    if (event.shiftKey || event.ctrlKey) {
      const index = designerCanvas.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem);
      if (index >= 0) {
        let newSelectedList = designerCanvas.instanceServiceContainer.selectionService.selectedElements.slice(0);
        newSelectedList.splice(index, 1);
        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList, event);
      }
      else {
        let newSelectedList = designerCanvas.instanceServiceContainer.selectionService.selectedElements.slice(0);
        newSelectedList.push(currentDesignItem);
        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList, event);
      }
    } else {
      if (designerCanvas.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem) < 0)
        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem], event);
    }
  }

  static FindPossibleContainer(designItem: IDesignItem, designItems: IDesignItem[], event: IPoint): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
    let newContainerElementDesignItem: IDesignItem = null;
    let newContainerService: IPlacementService = null;

    const designerCanvas = designItem.instanceServiceContainer.designerCanvas;
    const elementsFromPoint = designerCanvas.elementsFromPoint(event.x, event.y);
    elementsFromPoint.push(designerCanvas.rootDesignItem.element);
    for (let e of elementsFromPoint) {
      if (e == designItem.element) {
        continue;
      } else if (e == designItem.parent.element) {
        break;
      } else if (e == designerCanvas.rootDesignItem.element) {
        newContainerElementDesignItem = designerCanvas.rootDesignItem;
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle, designItem));
        break;
      } else if (false) {
        //check we don't try to move a item over one of its children..
      } else {
        newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle, designItem));
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