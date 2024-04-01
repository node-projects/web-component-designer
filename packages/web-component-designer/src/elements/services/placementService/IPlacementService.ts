import { IService } from '../IService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { IPoint } from '../../../interfaces/IPoint.js';

export interface IPlacementService extends IService {
  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration, item?: IDesignItem): boolean;
  isEnterableContainer(container: IDesignItem): boolean;
  canEnter(container: IDesignItem, items: IDesignItem[]): boolean;
  canLeave(container: IDesignItem, items: IDesignItem[]): boolean;
  enterContainer(container: IDesignItem, items: IDesignItem[], mode: 'normal' | 'drop');
  leaveContainer(container: IDesignItem, items: IDesignItem[]);
  getElementOffset(container: IDesignItem, designItem?: IDesignItem): IPoint;
  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint;
  startPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]);
  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]);
  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]);
  moveElements(designItems: IDesignItem[], position: IPoint, absolute: boolean);
}