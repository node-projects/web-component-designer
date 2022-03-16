import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../../Constants.js";
import { NamedTools } from "../NamedTools.js";

export interface ToolTypeAsArg  {
    command_parameter : string;
    open_popup?: boolean;
    popup_category?: string;
}

export interface AdvancedToolTypeAsArg extends ToolTypeAsArg {
    background_url: string;
    title: string;
    command: string;
}

export interface ToolPopupCategoryCollection {
    category: string;
    command: string;
    command_parameter: string;
    title: string;
    tool: NamedTools;
    background_url: string;
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
        <div id="toolbar-host" class="toolbar-host"></div>`;

    public readonly toolActivated = new TypedEvent<ToolTypeAsArg>();
    private _toolButtons : HTMLElement[];
    private _lastTool : HTMLElement;
    private _toolCollection : ToolPopupCategoryCollection[];
    private _toolbarhost : HTMLDivElement;

    ready(){
        this._initToolCategories();
        this._toolbarhost = this._getDomElement<HTMLDivElement>("toolbar-host");
    }

    public setToolsExternal(tools : ChildNode[]){
        for(let tool of tools){
            this._toolbarhost.appendChild(tool);
        }
        this._createToolEventListeners();
    }

    private _initToolCategories(){
        let toolCollection : ToolPopupCategoryCollection[] = [];
        toolCollection.push({tool: NamedTools.Pointer, category: "pointer", command: "setTool", command_parameter: NamedTools.Pointer, title: "Pointer Tool", background_url: "url("+assetsPath+"images/layout/PointerTool.svg)"});
        toolCollection.push({tool: NamedTools.MagicWandSelector, category: "selector", command: "setTool", command_parameter: NamedTools.MagicWandSelector, title: "Magic Wand Selector", background_url: "url("+assetsPath+"images/layout/MagicWandTool.svg)"});
        toolCollection.push({tool: NamedTools.RectangleSelector, category: "selector", command: "setTool", command_parameter: NamedTools.RectangleSelector, title: "Rectangle Selector", background_url: "url("+assetsPath+"images/layout/SelectRectTool.svg)"});
        toolCollection.push({tool: NamedTools.DrawLine, category: "draw", command: "setTool", command_parameter: NamedTools.DrawLine, title: "Draw Line", background_url: "url("+assetsPath+"images/layout/DrawLineTool.svg)"});
        toolCollection.push({tool: NamedTools.DrawPath, category: "draw", command: "setTool", command_parameter: NamedTools.DrawPath, title: "Draw Path", background_url: "url("+assetsPath+"images/layout/DrawPathTool.svg)"});
        toolCollection.push({tool: NamedTools.DrawRect, category: "draw", command: "setTool", command_parameter: NamedTools.DrawRect, title: "Draw Rectangle", background_url: "url("+assetsPath+"images/layout/DrawRectTool.svg)"});
        toolCollection.push({tool: NamedTools.DrawEllipsis, category: "draw", command: "setTool", command_parameter: NamedTools.DrawEllipsis, title: "Draw Ellipsis", background_url: "url("+assetsPath+"images/layout/DrawEllipTool.svg)"});
        toolCollection.push({tool: NamedTools.Zoom, category: "zoom", command: "setTool", command_parameter: NamedTools.Zoom, title: "Zoom Tool", background_url: "url("+assetsPath+"images/layout/ZoomTool.svg)"});
        toolCollection.push({tool: NamedTools.Text, category: "text", command: "setTool", command_parameter: NamedTools.Text, title: "Text Tool", background_url: "url("+assetsPath+"images/layout/TextTool.svg)"});
        toolCollection.push({tool: NamedTools.TextBoc, category: "text", command: "setTool", command_parameter: NamedTools.TextBoc, title: "Textbox Tool", background_url: "url("+assetsPath+"images/layout/TextBoxTool.svg)"});
        toolCollection.push({tool: NamedTools.PickColor, category: "pick", command: "setTool", command_parameter: NamedTools.PickColor, title: "Color Picker", background_url: "url("+assetsPath+"images/layout/ColorPickerTool.svg)"});

        this._toolCollection = toolCollection;
    }

    private _createToolEventListeners(){
        this._toolButtons = [...this._toolbarhost.querySelectorAll<HTMLDivElement>('div.tool')];
        for (let tool of this._toolButtons){
            tool.addEventListener("click", () => this._toolSelected(tool))
        }
    }

    private _toolSelected(tool : HTMLElement){
        let isPopup = this._lastTool === tool;
        this.toolActivated.emit({
            command_parameter: tool.getAttribute("data-command-parameter"),
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

    public get toolCollection(){
        return this._toolCollection;
    }
}
customElements.define('node-projects-designer-tools-buttons', DesignerToolsButtons);