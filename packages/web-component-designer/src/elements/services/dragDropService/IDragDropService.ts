import { IDesignItem } from "../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IPlacementService } from "../placementService/IPlacementService.js";

export interface IDragDropService {
  dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent);
  dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent);
  dragOver(designerCanvas: IDesignerCanvas, event: DragEvent);
  drop(designerCanvas: IDesignerCanvas, event: DragEvent);
  getPossibleContainerForDragDrop(designerCanvas: IDesignerCanvas, event: DragEvent, designItems?: IDesignItem[]): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService]
}