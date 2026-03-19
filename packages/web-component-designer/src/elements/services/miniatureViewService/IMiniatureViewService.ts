import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";

export interface IMiniatureViewService {
    provideMiniatureView(designerCanvas: IDesignerCanvas): Promise<Node>;
}