import { IService } from "../IService";
import { IDesignItem } from "../../item/IDesignItem";
import { IPlacementView } from "../../widgets/designerView/IPlacementView";
import { IPoint } from "../../../interfaces/IPoint";

export interface IPlacementService extends IService {
  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration)
  canEnter(container: IDesignItem, items: IDesignItem[])
  canLeave(container: IDesignItem, items: IDesignItem[])
  enterContainer(container: IDesignItem, items: IDesignItem[])
  leaveContainer(container: IDesignItem, items: IDesignItem[])
  getElementOffset(container: IDesignItem, designItem?: IDesignItem): IPoint
  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl:IPoint,newPoint: IPoint, items: IDesignItem[]): IPoint;
  startPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl:IPoint,newPoint: IPoint, items: IDesignItem[])
  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl:IPoint,newPoint: IPoint, items: IDesignItem[])
  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[])
}