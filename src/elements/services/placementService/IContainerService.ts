import { IService } from "../IService";
import { IDesignItem } from "../../item/IDesignItem";
import { IPlacementView } from "../../widgets/designerView/IPlacementView";
import { IDesignerMousePoint } from "../../../interfaces/IDesignerMousePoint";

export interface IContainerService extends IService {
  serviceForContainer(container: IDesignItem)
  canEnter(container: IDesignItem, items: IDesignItem[])
  canLeave(container: IDesignItem, items: IDesignItem[])
  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[])
  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[])
}