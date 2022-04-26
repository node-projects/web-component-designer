import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";

export class SelectorToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    return new DesignerToolbarButton(designerCanvas, {
       'RectangleSelector': { icon: assetsPath + 'images/layout/SelectRectTool.svg' },
       'MagicWandSelector': { icon: assetsPath + 'images/layout/MagicWandTool.svg' } });
  }
}