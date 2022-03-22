import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { CommandType } from "../../../../commandHandling/CommandType.js";
import { IUiCommand } from "../../../../commandHandling/IUiCommand.js";
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { DesignerView } from "../designerView.js";
import { DesignerToolbarPopup } from "./designerToolbarGenerics/designerToolbarPopup.js";
import { DesignerToolRenderer } from "./designerToolbarGenerics/designerToolRenderer.js";
import "./designerToolbarGenerics/designerToolsButtons.js";
import { DesignerToolsButtons, ToolPopupCategoryCollection } from "./designerToolbarGenerics/designerToolsButtons.js";
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
            left: calc(24px + 4px + 10px);
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
            <node-projects-designer-popup-drawtool popup="draw" class="popup" title="Drawtools" tabindex="-1">
            </node-projects-designer-popup-drawtool>
        </div>
    `;

    private _designerView: DesignerView;
    private _toolButtonsElem: DesignerToolsButtons;
    private _toolPopupElems: DesignerToolbarPopup[];
    private _serviceContainer: ServiceContainer;
    private _prevSelected: ToolPopupCategoryCollection[] = [];

    async ready() {
        this._toolButtonsElem = this._getDomElement<DesignerToolsButtons>("tool-buttons");
        this._toolButtonsElem.toolActivated.on((toolActivated => {
            this._toolButtonActivated(toolActivated[0], toolActivated[1]);
        }));

        this._registerPopups();

        let categories: string[] = [];

        await this._waitForChildrenReady();

        //TODO: warum macht das nicht alles die tools buttons liste selbst????
        let tools = [];
        for (let tool of this._toolButtonsElem.toolCollection) {
            if (!categories.includes(tool.category)) {
                tools.push(DesignerToolRenderer.createToolFromObject(tool));
                categories.push(tool.category);
            }
        }

        this._toolButtonsElem.setToolsExternal(tools);
    }

    public initialize(serviceContainer: ServiceContainer, designerView: DesignerView) {
        this._serviceContainer = serviceContainer;

        this._serviceContainer.globalContext.onToolChanged.on((e) => {
            let command_name: string;
            let found = false;
            this._serviceContainer.designerTools.forEach((tool, key) => {
                if (tool === e.newValue && !found) {
                    command_name = key;
                    found = true;
                    this._toolButtonsElem.externalToolChange(command_name);
                }
            });

        })

        this._designerView = designerView;
    }

    private _registerPopups() {
        let popups = this._getDomElement<HTMLElement>("popups");
        this._toolPopupElems = [...popups.querySelectorAll<DesignerToolbarPopup>('.popup')]

        //DrawToolPopup
        let drawToolPopup = popups.querySelectorAll<DrawToolPopup>("node-projects-designer-popup-drawtool")[0]
        drawToolPopup.toolActivated.on((toolArg) => this._popupToolSelected(drawToolPopup, toolArg));
    }

    private _toolButtonActivated(tool: ToolPopupCategoryCollection, external : boolean) {
        this._hideAllPopups();

        this._prevSelected[1] = this._prevSelected[0];
        this._prevSelected[0] = tool;

        if(!external){
            if (this._isPopupScenario()) {
                this._resetPreviousElements();
                this._activatePopup(tool.category);
            }
        }

        this._toolButtonsElem.markToolAsSelected(tool.command_parameter);

        let command: IUiCommand = {
            type: CommandType.setTool,
            parameter: tool.command_parameter,
        }
        this._designerView.executeCommand(command);
    }

    private _activatePopup(category: string) {
        this._toolPopupElems.find(x => x.getAttribute("popup") == category)?.setAttribute("opened", "");
    }

    private _popupToolSelected(popup: DesignerToolbarPopup, tool: ToolPopupCategoryCollection) {

    }

    private _isPopupScenario() {
        return JSON.stringify(this._prevSelected[1]) === JSON.stringify(this._prevSelected[0]);
    }

    private _resetPreviousElements() {
        for (let i = 0; i < this._prevSelected.length; i++) {
            this._prevSelected[i] = null;
        }
    }

    private _hideAllPopups() {
        for (let popup of this._toolPopupElems) {
            popup.removeAttribute("opened");
        }
    }
}
customElements.define('node-projects-designer-tools-dock', DesignerToolsDock);