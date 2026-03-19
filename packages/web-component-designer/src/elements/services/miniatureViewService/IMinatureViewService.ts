import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";

export interface IMinatureViewService {
    provideMiniatureView(designerCanvas: IDesignerCanvas): Promise<Node>;
}