import { DesignerView } from "../../designerView.js";
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";
import { gridExtensionShowOverlayOptionName } from "../GridExtensionProvider.js";

export class GridExtensionDesignViewConfigButtons implements IDesignViewConfigButtonsProvider {

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    const extensionOptions = designerCanvas.instanceServiceContainer.designContext.extensionOptions;
    const btn = document.createElement('div');
    btn.innerText = 'G';
    btn.title = 'show grid overlay';
    btn.className = 'toolbar-control';

    if (extensionOptions[gridExtensionShowOverlayOptionName] !== false)
      btn.classList.add('selected');
    btn.onclick = () => {
      const val = extensionOptions[gridExtensionShowOverlayOptionName]
      extensionOptions[gridExtensionShowOverlayOptionName] = val === false ? true : false;
      if (extensionOptions[gridExtensionShowOverlayOptionName] !== false)
        btn.classList.add('selected');
      else
        btn.classList.remove('selected');
      designerCanvas.extensionManager.reapplyAllAppliedExtentions();
    }
    return [btn];
  }
}