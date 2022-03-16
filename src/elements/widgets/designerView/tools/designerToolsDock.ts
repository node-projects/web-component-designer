import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { DesignerToolbarPopup } from "./designerToolbarGenerics/designerToolbarPopup.js";
import { DesignerToolRenderer } from "./designerToolbarGenerics/designerToolRenderer.js";
import "./designerToolbarGenerics/designerToolsButtons.js";
import { AdvancedToolTypeAsArg, DesignerToolsButtons, ToolTypeAsArg } from "./designerToolbarGenerics/designerToolsButtons.js";
import "./designerToolbarPopups/DrawToolPopup.js";
import { DrawToolPopup } from "./designerToolbarPopups/DrawToolPopup.js";


export class DesignerToolsDock extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
        node-projects-designer-tools-buttons {
            height: 100%;
            width: 100%;
        }

        #popups {
            position: absolute;
            top: calc(0px + 10px);
            height: 100%;
            left: calc(32px + 4px + 10px);
        }

        #popups > * {
            display: none;
        }

        #popups > *[opened] {
            display: block;
        }
    `;

    static override readonly template = html`
        <node-projects-designer-tools-buttons id="tool-buttons"></node-projects-designer-tools-buttons>
        <div id="popups">
            <node-projects-designer-popup-drawtool value="draw-popup" class="popup" title="Drawtools" tabindex="-1">
            </node-projects-designer-popup-drawtool>
        </div>
    `;

    private _toolButtonsElem: DesignerToolsButtons;
    private _toolPopupElems: DesignerToolbarPopup[];
    private _serviceContainer: ServiceContainer;

    ready() {
        this._toolButtonsElem = this._getDomElement<DesignerToolsButtons>("tool-buttons");
        this._toolButtonsElem.toolActivated.on((toolType => {
            this._toolButtonActivated(toolType);
        }));

        this._registerPopups();

        let categories : string[] = [];
        
        let tools = [];
        for(let tool of this._toolButtonsElem.toolCollection){
            if(!categories.includes(tool.category)){
                tools.push(DesignerToolRenderer.createTool(tool));
                categories.push(tool.category);
            }
        }

        this._toolButtonsElem.setToolsExternal(tools);
    }

    public initialize(serviceContainer : ServiceContainer){
        this._serviceContainer = serviceContainer;

        this._serviceContainer.globalContext.onToolChanged.on((e) => {
            let command_name : string; 
            let found = false;
            this._serviceContainer.designerTools.forEach((tool, key) => {
                if(tool === e.newValue && !found){
                    command_name = key;
                    found = true;
                    this._toolButtonsElem.externalToolChange(command_name);
                } 
            });

        })
    }

    private _registerPopups(){
        let popups = this._getDomElement<HTMLElement>("popups");
        this._toolPopupElems = [...popups.querySelectorAll<DesignerToolbarPopup>('.popup')]

        //DrawToolPopup
        let drawToolPopup = popups.querySelectorAll<DrawToolPopup>("node-projects-designer-popup-drawtool")[0]
        drawToolPopup.toolActivated.on((toolArg) => this._popupToolSelected(drawToolPopup, toolArg));
    }

    private _toolButtonActivated(toolType: ToolTypeAsArg) {
        this._hideAllPopups();

        if (toolType.open_popup) this._activatePopup(toolType.popup_category);
        this._toolButtonsElem.markToolAsSelected(toolType.command_parameter);
    }

    private _activatePopup(id: string) {
        let combinedId = id + "-popup";
        this._toolPopupElems.find(x => x.getAttribute("value") == combinedId)?.setAttribute("opened", "");
    }

    private _popupToolSelected(popup : DesignerToolbarPopup, toolArg : AdvancedToolTypeAsArg){

    }

    private _hideAllPopups() {
        for (let popup of this._toolPopupElems) {
            popup.removeAttribute("opened");
        }
    }
}
customElements.define('node-projects-designer-tools-dock', DesignerToolsDock);