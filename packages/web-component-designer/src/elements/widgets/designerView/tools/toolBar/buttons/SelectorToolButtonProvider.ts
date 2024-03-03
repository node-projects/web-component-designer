import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { SelectionToolPopup } from "../popups/SelectionToolPopup.js";

export class SelectorToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const button = new DesignerToolbarButton(designerCanvas, {
      'RectangleSelector': { icon: assetsPath + 'images/tools/SelectRectTool.svg' },
      'MagicWandSelector': { icon: assetsPath + 'images/tools/MagicWandTool.svg' }
    });
    button.popup = SelectionToolPopup
    return button;
  }
}