import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IService } from "../IService";

export interface IElementInteractionService extends IService {
    stopEventHandling(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) : boolean;
}