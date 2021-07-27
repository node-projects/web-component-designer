import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IDesignerMousePoint } from '../../../interfaces/IDesignerMousePoint.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';

export class GridPlacementService implements IPlacementService {

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
  }
  
  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  serviceForContainer(container: IDesignItem) {
    if ((<HTMLElement>container.element).style.display == 'grid' || (<HTMLElement>container.element).style.display == 'inline-grid')
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

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]): IPoint {
    return null;
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {

  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {

  }
}