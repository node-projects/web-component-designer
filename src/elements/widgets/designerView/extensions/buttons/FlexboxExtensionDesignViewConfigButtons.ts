import { DesignerView } from "../../designerView.js";
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";
import { flexboxExtensionShowOverlayOptionName } from "../FlexboxExtensionProvider.js";

export class FlexboxExtensionDesignViewConfigButtons implements IDesignViewConfigButtonsProvider {

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    const extensionOptions = designerCanvas.instanceServiceContainer.designContext.extensionOptions;
    const btn = document.createElement('div');
    btn.innerText = 'F';
    btn.title = 'show flexbox overlay';
    btn.className = 'toolbar-control';

    if (extensionOptions[flexboxExtensionShowOverlayOptionName] !== false)
      btn.classList.add('selected');
    btn.onclick = () => {
      const val = extensionOptions[flexboxExtensionShowOverlayOptionName]
      extensionOptions[flexboxExtensionShowOverlayOptionName] = val === false ? true : false;
      if (extensionOptions[flexboxExtensionShowOverlayOptionName] !== false)
        btn.classList.add('selected');
      else
        btn.classList.remove('selected');
      designerCanvas.extensionManager.reapplyAllAppliedExtentions();
    }
    return [btn];
  }
}