import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../Constants.js";


export class DesignerToolsButtons extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    .toolbar-host{
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
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
    <div id="toolbar-host" class="toolbar-host">
        <div class="tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/PointerTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="MagicWandSelector" title="Magic Wand Selector" style="background-image: url('${assetsPath}images/layout/MagicWandTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="RectangleSelector" title="Rectangle Selector" style="background-image: url('${assetsPath}images/layout/SelectRectTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="Zoom" title="Zoom Tool" style="background-image: url('${assetsPath}images/layout/ZoomTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="Text" title="Text Tool" style="background-image: url('${assetsPath}images/layout/TextTool.svg');"></div>
        <div class="tool" data-command="setTool" data-command-parameter="TextBoc" title="Textbox Tool" style="background-image: url('${assetsPath}images/layout/TextBoxTool.svg');"></div>
    </div>`;

}
customElements.define('node-projects-designer-tools-buttons', DesignerToolsButtons);