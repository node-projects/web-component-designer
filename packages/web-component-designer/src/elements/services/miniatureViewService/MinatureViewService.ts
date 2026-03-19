import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IMinatureViewService } from "./IMinatureViewService.js";

export class MinatureViewService implements IMinatureViewService {
    public async provideMiniatureView(designerCanvas: IDesignerCanvas): Promise<Node> {
        let el = document.createDocumentFragment();
        for (const e of designerCanvas.rootDesignItem.children()) {
            el.appendChild(e.element.cloneNode(true));
        }
        return el;
    }
}