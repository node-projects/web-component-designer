import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";

export class TextToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    return new DesignerToolbarButton(designerCanvas, { 'Text': { icon: assetsPath + 'images/tools/TextTool.svg' } });
  }
}