import { DesignerView } from "../designerView.js";
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "../IDesignViewConfigButtonsProvider.js";
import { invisibleElementExtensionShowOverlayOptionName } from "./InvisibleElementExtensionProvider.js";

export class InvisibleElementExtensionDesignViewConfigButtons implements IDesignViewConfigButtonsProvider {

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    const extensionOptions = designerCanvas.instanceServiceContainer.designContext.extensionOptions;
    const btn = document.createElement('div');
    btn.innerText = 'I';
    btn.title = 'show invisible div overlay';
    btn.className = 'toolbar-control';

    if (extensionOptions[invisibleElementExtensionShowOverlayOptionName] !== false)
      btn.classList.add('selected');
    btn.onclick = () => {
      const val = extensionOptions[invisibleElementExtensionShowOverlayOptionName]
      extensionOptions[invisibleElementExtensionShowOverlayOptionName] = val === false ? true : false;
      if (extensionOptions[invisibleElementExtensionShowOverlayOptionName] !== false)
        btn.classList.add('selected');
      else
        btn.classList.remove('selected');
      designerCanvas.extensionManager.reapplyAllAppliedExtentions();
    }
    return [btn];
  }
}