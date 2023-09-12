import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IService } from '../IService.js';

export interface IElementInteractionService extends IService {
    stopEventHandling(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) : boolean;
}