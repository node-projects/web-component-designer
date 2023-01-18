import { ContextMenu } from "../../../../helper/contextMenu/ContextMenu.js";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextMenuItem.js";
import { DesignerView } from "../../designerView.js";
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignViewConfigButtonsProvider } from "./IDesignViewConfigButtonsProvider.js";

export class AbstractDesignViewConfigButton implements IDesignViewConfigButtonsProvider {

  protected settingName;

  private content: string | HTMLElement;
  private tooltp: string;
  private contextmenu: IContextMenuItem[];

  constructor(settingName: string, content: string | HTMLElement, tooltip: string, contextmenu?: IContextMenuItem[]) {
    this.settingName = settingName;
    this.content = content;
    this.tooltp = tooltip;
    this.contextmenu = contextmenu;
  }

  provideButtons(designerView: DesignerView, designerCanvas: IDesignerCanvas): HTMLElement[] {

    const btn = document.createElement('div');
    if (typeof this.content == 'string')
      btn.innerHTML = this.content;
    else
      btn.appendChild(this.content);
    btn.title = this.tooltp;
    btn.className = 'toolbar-control';

    const extensionOptions = designerCanvas.instanceServiceContainer.designContext.extensionOptions;
    if (extensionOptions[this.settingName] !== false)
      btn.classList.add('selected');
    btn.onclick = () => {
      const val = extensionOptions[this.settingName]
      extensionOptions[this.settingName] = val === false ? true : false;
      if (extensionOptions[this.settingName] !== false)
        btn.classList.add('selected');
      else
        btn.classList.remove('selected');
    }

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      if (this.contextmenu) {
        ContextMenu.show(this.contextmenu, e);
      }
    }

    return [btn];
  }
}