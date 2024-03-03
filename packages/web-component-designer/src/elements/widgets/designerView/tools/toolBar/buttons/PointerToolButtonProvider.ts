import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { PointerToolPopup } from "../popups/PointerToolPopup.js";

export class PointerToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const button = new DesignerToolbarButton(designerCanvas, { 'Pointer': { icon: assetsPath + 'images/tools/PointerTool.svg' } });
    button.popup = PointerToolPopup
    return button;
  }
}