import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { DrawToolPopup } from "../popups/DrawToolPopup.js";

export class DrawToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const button = new DesignerToolbarButton(designerCanvas, {
      'DrawLine': { icon: assetsPath + 'images/tools/DrawLineTool.svg' },
      'DrawPath': { icon: assetsPath + 'images/tools/DrawPathTool.svg' },
      'DrawRect': { icon: assetsPath + 'images/tools/DrawRectTool.svg' },
      'DrawEllipsis': { icon: assetsPath + 'images/tools/DrawEllipTool.svg' },
      'PickColor': { icon: assetsPath + 'images/tools/ColorPickerTool.svg' }
    });
    button.popup = DrawToolPopup
    return button;
  }
}