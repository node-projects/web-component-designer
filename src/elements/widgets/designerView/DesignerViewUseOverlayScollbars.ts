import { IDesignerCanvas } from "./IDesignerCanvas.js";
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";
import { DesignerView } from './designerView';

//todo, element moving does not work atm, needs to be fixed
export class DesignerViewUseOverlayScollbars implements IDesignViewConfigButtonsProvider {

  constructor() {
  }
  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    let externalCss = document.createElement('style');
    externalCss.innerHTML = '@import url("./node_modules/overlayscrollbars/css/OverlayScrollbars.min.css");';
    designerCanvas.shadowRoot.appendChild(externalCss);
    //@ts-ignore
    setTimeout(() => OverlayScrollbars([designerCanvas._outercanvas2], { }), 5000);
    return [];
  }
}