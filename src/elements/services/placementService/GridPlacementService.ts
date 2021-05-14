import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IContainerService } from './IContainerService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IDesignerMousePoint } from '../../../interfaces/IDesignerMousePoint.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';

export class DefaultPlacementService implements IContainerService {

  serviceForContainer(container: IDesignItem) {
    if ((<HTMLElement>container.element).style.display == 'grid')
      return true;
    return false;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  canLeave(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]): IPoint {
    return null;
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {

  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {

  }
}