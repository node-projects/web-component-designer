import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IMiniatureViewService } from "./IMiniatureViewService.js";

export class MiniatureViewService implements IMiniatureViewService {
    public async provideMiniatureView(designerCanvas: IDesignerCanvas): Promise<Node> {
        let el = document.createDocumentFragment();
        for (const e of designerCanvas.rootDesignItem.children()) {
            el.appendChild(e.element.cloneNode(true));
        }
        return el;
    }
}