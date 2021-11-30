import { IPoint } from '../../../interfaces/IPoint.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { IPlacementService } from './IPlacementService.js';

export class FlexBoxPlacementService implements IPlacementService {
 
  enterContainer(container: IDesignItem, items: IDesignItem[]) {
    for (let i of items) {
      i.removeStyle("position");
      i.removeStyle("left");
      i.removeStyle("top");
      i.removeStyle("right");
      i.removeStyle("transform");
    }
  }
 
  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  serviceForContainer(container: IDesignItem) {
    if ((<HTMLElement>container.element).style.display == 'flex' || (<HTMLElement>container.element).style.display == 'inline-flex')
      return true;
    return false;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  canLeave(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  getElementOffset(container: IDesignItem, designItem?: IDesignItem): IPoint {
    return container.element.getBoundingClientRect();
  }

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    return null;
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    /*let direction = getComputedStyle(container.element).flexDirection;
    
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);
    const posElement = (<IDesignerCanvas><unknown>placementView).getNormalizedElementCoordinates(items[0].element)

    for (let e of container.element.children) {

    }*/
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {

  }
}
