import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../../Constants.js";

export type ToolTypeAsArg = {
    data_command : string,
    open_popup: boolean,
    popup_category: string,
}

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

    .tool[selected] {
        background-color: rgb(47, 53, 69);
    }

    .tool:hover {
        cursor: pointer;
    }
`;

    static override readonly template = html`
        <div id="toolbar-host" class="toolbar-host">
            <div class="tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/PointerTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="MagicWandSelector" title="Magic Wand Selector" style="background-image: url('${assetsPath}images/layout/MagicWandTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="RectangleSelector" title="Rectangle Selector" style="background-image: url('${assetsPath}images/layout/SelectRectTool.svg');"></div>
            <div class="tool" data-command="setTool" popup="draw" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="Zoom" title="Zoom Tool" style="background-image: url('${assetsPath}images/layout/ZoomTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="Text" title="Text Tool" style="background-image: url('${assetsPath}images/layout/TextTool.svg');"></div>
            <div class="tool" data-command="setTool" data-command-parameter="TextBoc" title="Textbox Tool" style="background-image: url('${assetsPath}images/layout/TextBoxTool.svg');"></div>
        </div>`;

    public readonly toolActivated = new TypedEvent<ToolTypeAsArg>();
    private _toolButtons : HTMLElement[];
    private _lastTool : HTMLElement;

    ready(){
        let toolbarhost = this._getDomElement<HTMLElement>("toolbar-host");
        this._toolButtons = [...toolbarhost.querySelectorAll<HTMLDivElement>('div.tool')];
        for (let tool of this._toolButtons){
            tool.addEventListener("click", () => this._toolSelected(tool))
        }
    }

    private _toolSelected(tool : HTMLElement){
        let isPopup = this._lastTool === tool;
        this.toolActivated.emit({
            data_command: tool.getAttribute("data-command-parameter"),
            open_popup: isPopup,
            popup_category: tool.getAttribute("popup"),
        })
        this._lastTool = tool;
    }

    public markToolAsSelected(id : string){
        this._unselectTools();

        let selectedElement = this._toolButtons.find(t => t.getAttribute("data-command-parameter") == id);
        selectedElement?.setAttribute("selected", "");
    }

    private _unselectTools(){
        for(let tool of this._toolButtons){
            tool.removeAttribute("selected");
        }
    }

    public externalToolChange(command_name : string){
        let tool = this._toolButtons.find(x => x.getAttribute("data-command-parameter") == command_name);
        if(tool != null) {
            this._resetLastTool();
            this._toolSelected(tool);
        }
    }

    private _resetLastTool(){
        this._lastTool = null;
    }
}
customElements.define('node-projects-designer-tools-buttons', DesignerToolsButtons);