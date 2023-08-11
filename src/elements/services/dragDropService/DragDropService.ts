import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { DesignItem } from '../../item/DesignItem.js';
import { IDragDropService } from "./IDragDropService.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IPlacementService } from "../placementService/IPlacementService.js";
import { IElementDefinition } from "../elementsService/IElementDefinition.js";
import { InsertAction } from "../undoService/transactionItems/InsertAction.js";
import { ExtensionType } from "../../widgets/designerView/extensions/ExtensionType.js";
import { dragDropFormatNameElementDefinition } from "../../../Constants.js";

export class DragDropService implements IDragDropService {
  private _dragOverExtensionItem: IDesignItem;
  private _oldX: number;
  private _oldY: number;

  public dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent) {
  }

  public dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (this._dragOverExtensionItem) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      this._dragOverExtensionItem = null;
    }
  }

  public dragOver(designerCanvas: IDesignerCanvas, event: DragEvent) {
    let [newContainer] = this.getPossibleContainerForDragDrop(designerCanvas, event);
    if (this._dragOverExtensionItem != newContainer) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      designerCanvas.extensionManager.applyExtension(newContainer, ExtensionType.ContainerExternalDragOverAndCanBeEntered, event);
      this._dragOverExtensionItem = newContainer;
    } else {
      if (event.x != this._oldX && event.y != this._oldY) {
        this._oldX = event.x;
        this._oldY = event.y;
        designerCanvas.extensionManager.refreshExtension(newContainer, ExtensionType.ContainerExternalDragOverAndCanBeEntered, event);
      }
    }
  }

  public async drop(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (this._dragOverExtensionItem) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      this._dragOverExtensionItem = null;
    }

    let [newContainer] = this.getPossibleContainerForDragDrop(designerCanvas, event);
    if (!newContainer)
      newContainer = designerCanvas.rootDesignItem;

    //TODO : we need to use container service for adding to element, so also grid and flexbox work correct
    const transferData = event.dataTransfer.getData(dragDropFormatNameElementDefinition);
    const elementDefinition = <IElementDefinition>JSON.parse(transferData);
    const di = await designerCanvas.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer));
    const grp = di.openGroup("Insert of &lt;" + di.name + "&gt;");
    di.setStyle('position', 'absolute');
    const containerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainer, getComputedStyle(newContainer.element)))
    containerService.enterContainer(newContainer, [di]);

    const containerPos = designerCanvas.getNormalizedElementCoordinates(newContainer.element);
    const evCoord = designerCanvas.getNormalizedEventCoordinates(event);
    const pos = { x: evCoord.x - containerPos.x, y: evCoord.y - containerPos.y };
    containerService.place(event, designerCanvas, newContainer, { x: 0, y: 0 }, { x: 0, y: 0 }, pos, [di]);
    containerService.finishPlace(event, designerCanvas, newContainer, { x: 0, y: 0 }, { x: 0, y: 0 }, pos, [di]);
    designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(newContainer, newContainer.childCount, di));
    requestAnimationFrame(() => {
      designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]);
      grp.commit();
    });
  }

  public getPossibleContainerForDragDrop(designerCanvas: IDesignerCanvas, event: DragEvent): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
    let newContainerElementDesignItem: IDesignItem = null;
    let newContainerService: IPlacementService = null;

    const elementsFromPoint = designerCanvas.elementsFromPoint(event.x, event.y);
    for (let e of elementsFromPoint) {
      if (e == designerCanvas.rootDesignItem.element) {
        newContainerElementDesignItem = designerCanvas.rootDesignItem;
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        break;
      } else if (false) {
        //check we don't try to move a item over one of its children..
      } else {
        newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        if (newContainerService) {
          //TODO: Maybe the check for SVG Elemnt should be in "canEnterByDrop"?
          if (newContainerService.isEnterableContainer(newContainerElementDesignItem) && !(newContainerElementDesignItem.element instanceof SVGElement)) {
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
}