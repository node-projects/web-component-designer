import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { DesignerToolbarPopup } from "./designerToolbarGenerics/designerToolbarPopup.js";
import "./designerToolbarGenerics/designerToolsButtons.js";
import { DesignerToolsButtons, ToolTypeAsArg } from "./designerToolbarGenerics/designerToolsButtons.js";
import "./designerToolbarPopups/DrawToolPopup.js";


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

    ready() {
        this._toolButtonsElem = this._getDomElement<DesignerToolsButtons>("tool-buttons");
        this._toolButtonsElem.toolActivated.on((toolType => {
            this._toolButtonActivated(toolType);
        }));


        this._toolPopupElems = [...this._getDomElement<HTMLElement>("popups").querySelectorAll<DesignerToolbarPopup>('.popup')]
    }

    private _toolButtonActivated(toolType: ToolTypeAsArg) {
        this._hideAllPopups();
        if (toolType.open_popup) this._activatePopup(toolType.popup_category);
    }

    private _activatePopup(id: string) {
        let combinedId = id + "-popup";
        this._toolPopupElems.find(x => x.getAttribute("value") == combinedId)?.setAttribute("opened", "");
    }

    private _hideAllPopups() {
        for (let popup of this._toolPopupElems) {
            popup.removeAttribute("opened");
        }
    }
}
customElements.define('node-projects-designer-tools-dock', DesignerToolsDock);