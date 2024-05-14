import { ContextMenu } from "../../../../helper/contextMenu/ContextMenu.js";
import { DesignerView } from "../../designerView.js";
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";

export class OptionsContextMenuButton implements IDesignViewConfigButtonsProvider {

  constructor() {
  }

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {
    const btn = document.createElement('div');
    btn.innerHTML = 'O';
    btn.title = 'options';
    btn.className = 'toolbar-control';
    btn.onclick = (e) => {
      this.showCtxMenu(e, designerCanvas);
    }
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      this.showCtxMenu(e, designerCanvas);
    }

    return [btn];
  }

  showCtxMenu(event: MouseEvent, designerCanvas: IDesignerCanvas) {
    ContextMenu.show([
      {
        title: 'simulate hover on hover', checked: designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover, action: () => {
          designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover = !designerCanvas.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover;
        }
      },
      {
        title: 'select unhitable elements', checked: designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements, action: () => {
          designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements = !designerCanvas.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements;
        }
      }
    ], event);
  }
}