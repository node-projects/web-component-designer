import { DesignerView } from "./designerView.js";
import { IDesignerCanvas } from "./IDesignerCanvas.js";

export interface IDesignViewConfigButtonsProvider {
  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[]
}
