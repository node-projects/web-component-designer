import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { SelectionToolPopup } from "../popups/SelectionToolPopup.js";

export class SelectorToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const button = new DesignerToolbarButton(designerCanvas, {
      'RectangleSelector': { icon: assetsPath + 'images/layout/SelectRectTool.svg' },
      'MagicWandSelector': { icon: assetsPath + 'images/layout/MagicWandTool.svg' }
    });
    button.popup = SelectionToolPopup
    return button;
  }
}