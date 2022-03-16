import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../../Constants.js";

export class DesignerToolbarPopupToolSelect extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    .popup-tool-select {
        display: flex;
        flex-wrap: wrap;
    }

    .tool {
        height: 32px;
        width: 32px;
        background-color: rgb(255, 255, 255);
        background-size: 65%;
        background-repeat: no-repeat;
        background-position: center center;
        flex-shrink: 0;
        border-bottom: 1px solid black;
    }
`;

    static override readonly template = html`
        <div id="popup-tool-select" class="popup-tool-select">
            <div class="tool" data-command="setTool" popup="draw" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
        </div>`;
}
customElements.define('node-projects-designer-tools-popup-select', DesignerToolbarPopupToolSelect);