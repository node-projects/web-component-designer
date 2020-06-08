import { IService } from "../IService";
import { IDesignItem } from "../../item/IDesignItem";
import { IPlacementView } from "../../widgets/designerView/IPlacementView";
import { IDesignerMousePoint } from "../../../interfaces/IDesignermousePoint";

export interface IContainerService extends IService {
  serviceForContainer(container: IDesignItem)
  canEnter(container: IDesignItem, items: IDesignItem[])
  canLeave(container: IDesignItem, items: IDesignItem[])
  place(placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[])
  finishPlace(placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[])
}