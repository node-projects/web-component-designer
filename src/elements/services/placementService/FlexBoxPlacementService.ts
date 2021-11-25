import { IPoint } from '../../../interfaces/IPoint.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { IPlacementService } from './IPlacementService.js';

export class FlexBoxPlacementService implements IPlacementService {
 
  enterContainer(container: IDesignItem, items: IDesignItem[]) {
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
    //TODO: offset could be bigger, when it was in a other cell???
    return container.element.getBoundingClientRect();
  }

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    return null;
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {

  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {

  }
}
