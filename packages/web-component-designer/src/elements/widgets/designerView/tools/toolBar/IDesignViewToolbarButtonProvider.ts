import { IDesignerCanvas } from "../../IDesignerCanvas.js";

export interface IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement
}
