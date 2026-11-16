import { DesignerView } from "../../designerView.js";
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";

export class RoundPixelsDesignViewConfigButton implements IDesignViewConfigButtonsProvider {

  constructor() { }

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {

    const btn = document.createElement('div');
    btn.className = 'toolbar-control toolbar-control-input';
    btn.title = designerCanvas.serviceContainer.translationService.translate('round pixels to');
    btn.setAttribute('data-wcd-i18n-title', 'round pixels to');

    const ip = document.createElement('input');
    ip.type = 'number';
    ip.setAttribute('aria-label', 'Round pixels to decimal places');
    ip.setAttribute('data-wcd-i18n-aria-label', 'Round pixels to decimal places');
    ip.step = '1';
    ip.min = '-1';
    ip.valueAsNumber = designerView.serviceContainer.options.roundPixelsToDecimalPlaces;

    ip.onchange = () => designerView.serviceContainer.options.roundPixelsToDecimalPlaces = ip.valueAsNumber;

    btn.appendChild(ip);

    return [btn];
  }
}