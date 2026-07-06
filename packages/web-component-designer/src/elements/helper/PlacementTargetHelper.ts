import { IDesignItem } from "../item/IDesignItem.js";
import { IPlacementService } from "../services/placementService/IPlacementService.js";
import { IDesignerCanvas } from "../widgets/designerView/IDesignerCanvas.js";
import { DesignItem } from "../item/DesignItem.js";

export function getPossiblePlacementTarget(designerCanvas: IDesignerCanvas, event: MouseEvent, designItems?: IDesignItem[]): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
  let newContainerElementDesignItem: IDesignItem = null;
  let newContainerService: IPlacementService = null;

  const elementsFromPoint = designerCanvas.elementsFromPoint(event.clientX, event.clientY);
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
        //TODO: Maybe the check for SVG Element should be in "canEnterByDrop"?
        if (designItems && newContainerService.canEnter(newContainerElementDesignItem, designItems) && !(newContainerElementDesignItem.element instanceof newContainerElementDesignItem.window.SVGElement)) {
          break;
        } else if (!designItems && newContainerService.isEnterableContainer(newContainerElementDesignItem) && !(newContainerElementDesignItem.element instanceof newContainerElementDesignItem.window.SVGElement)) {
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
