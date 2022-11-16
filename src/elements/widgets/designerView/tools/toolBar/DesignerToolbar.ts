import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { CommandType } from "../../../../../commandHandling/CommandType.js";
import { ServiceContainer } from "../../../../services/ServiceContainer.js";
import { DesignerView } from "../../designerView.js";
//import { DesignerToolbarPopup } from "../designerToolbarGenerics/designerToolbarPopup.js";
//import { ToolPopupCategoryCollection } from "../designerToolbarGenerics/designerToolsButtons.js";
//import "../designerToolbarGenerics/designerToolsButtons.js";
//import "./popups/DrawToolPopup.js";
//import "./popups/SelectorToolsPopup.js";
import { DesignerToolbarButton } from './DesignerToolbarButton';

export class DesignerToolbar extends BaseCustomWebComponentConstructorAppend {
  static override readonly style = css`
        node-projects-designer-tools-buttons {
            height: 100%;
            width: 100%;
        }        

        #popup {
            position: absolute;
            top: calc(0px + 10px);
            height: 100%;
            left: calc(24px + 4px + 10px);
        }`;

  static override readonly template = html`
        <div id="popup"></div>
        <div id="toolButtons"></div>`;

  private _toolButtonsElem: HTMLDivElement;
  private _serviceContainer: ServiceContainer;
  private _popupContainer: HTMLDivElement;
  private _designerView: DesignerView;

  constructor() {
    super();
    this._toolButtonsElem = this._getDomElement<HTMLDivElement>("toolButtons");
    this._popupContainer = this._getDomElement<HTMLDivElement>("popup");
  }

  public initialize(serviceContainer: ServiceContainer, designerView: DesignerView) {
    this._serviceContainer = serviceContainer;
    this._designerView = designerView;

    for (let tb of this._serviceContainer.designViewToolbarButtons) {
      this._toolButtonsElem.appendChild(tb.provideButton(designerView.designerCanvas));
    }

    this._serviceContainer.globalContext.onToolChanged.on((e) => {
      for (const el of this._toolButtonsElem.children) {
        if (el instanceof DesignerToolbarButton) {
          el.setActiveTool(e.newValue.name);
        }
      }
    });
  }

  public showPopup(designerToolbarButton: DesignerToolbarButton) {
    if (this._popupContainer.children.length) {
      this._popupContainer.innerHTML = '';
    }
    else {
      let instance: HTMLElement;
      if (typeof designerToolbarButton.popup === 'string')
        instance = document.createElement(designerToolbarButton.popup);
      else
        instance = new designerToolbarButton.popup();
      this._popupContainer.appendChild(instance);
    }
  }

  public setTool(tool: string) {
    if (this._popupContainer.children.length) {
      this._popupContainer.innerHTML = '';
    }
    this._designerView.designerCanvas.executeCommand({ type: CommandType.setTool, parameter: tool });
  }

  public setStrokeColor(color: string){
    if (this._popupContainer.children.length) {
      this._popupContainer.innerHTML = '';
    }
    this._designerView.designerCanvas.executeCommand({ type: CommandType.setStrokeColor, parameter: color });
  }

  public setFillBrush(color: string){
    if (this._popupContainer.children.length) {
      this._popupContainer.innerHTML = '';
    }
    this._designerView.designerCanvas.executeCommand({ type: CommandType.setFillBrush, parameter: color });
  }

  public setStrokeThickness(input: string){
    if (this._popupContainer.children.length) {
      this._popupContainer.innerHTML = '';
    }
    this._designerView.designerCanvas.executeCommand({ type: CommandType.setStrokeThickness, parameter: input });
  }
}

customElements.define('node-projects-designer-toolbar', DesignerToolbar);