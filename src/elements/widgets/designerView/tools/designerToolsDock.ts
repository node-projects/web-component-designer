import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import "./designerToolsButtons.js";


export class DesignerToolsDock extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    node-projects-designer-tools-buttons {
        height: 100%;
        width: 100%;
    }
`;

    static override readonly template = html`
        <node-projects-designer-tools-buttons></node-projects-designer-tools-buttons>
        <div id="popups"></div>
    `;
}
customElements.define('node-projects-designer-tools-dock', DesignerToolsDock);