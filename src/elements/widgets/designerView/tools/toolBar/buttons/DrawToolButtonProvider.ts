import { IDesignerCanvas } from "../../../IDesignerCanvas.js";
import { IDesignViewToolbarButtonProvider } from "../IDesignViewToolbarButtonProvider.js";
import { DesignerToolbarButton } from '../DesignerToolbarButton.js';
import { assetsPath } from "../../../../../../Constants.js";
import { DrawToolPopup } from "../popups/DrawToolPopup.js";

export class DrawToolButtonProvider implements IDesignViewToolbarButtonProvider {
  provideButton(designerCanvas: IDesignerCanvas): HTMLElement {
    const button = new DesignerToolbarButton(designerCanvas, {
      'DrawLine': { icon: assetsPath + 'images/layout/DrawLineTool.svg' },
      'DrawPath': { icon: assetsPath + 'images/layout/DrawPathTool.svg' },
      'DrawRect': { icon: assetsPath + 'images/layout/DrawRectTool.svg' },
      'DrawEllipsis': { icon: assetsPath + 'images/layout/DrawEllipTool.svg' },
      'PickColor': { icon: assetsPath + 'images/layout/ColorPickerTool.svg' }
    });
    button.popup = DrawToolPopup
    return button;
  }
}