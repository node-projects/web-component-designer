import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { ITool } from "./ITool.js";

export class DesignerToolBar extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    .toolbar-host{
        background: #2f3545;
        width: 100%;
        height: 100%;
        border: 1px solid black;
        
        display: flex;
        flex-direction: column;
        align-items: center;

        min-height: calc(max-content - 20px);

        overflow: hidden;
    }

    .tool {
        height: 32px;
        width: 32px;
        background-color: #eeefef;
        border-radius: 5px;
        margin: 2px 0px;

        background-size: cover;
        background-size: 70%;
        background-repeat: no-repeat;
        background-position: center;

        flex-shrink: 0;
    }

    .multi-tool {

    }

    .tool.selected {
        background-color: green;
    }
`;

    static override readonly template = html`
    <div class="toolbar-host">
        <div class="tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer Tool" style="background-image: url('./assets/images/layout/PointerTool.svg');"></div>
        <div class="tool" style="background-image: url('./assets/images/layout/MagicWandTool.svg');"></div>
        <div class="tool" style="background-image: url('./assets/images/layout/DrawLineTool.svg');"></div>
        <div class="tool" style="background-image: url('./assets/images/layout/DrawPathTool.svg');"></div>
        <div class="tool" style="background-image: url('./assets/images/layout/DrawRectTool.svg');"></div>
        <div class="tool" style="background-image: url('./assets/images/layout/DrawEllipTool.svg');"></div>
    </div>`;

    public static properties = {
        orientation: String,
    }

    tools : ITool[] = [];
    orientation: 'vertical' | 'horizontal' = 'vertical';

    constructor() {
        super();
    }

    ready() {
        this._registerTools();
    }

    private _registerTools(){
        let toolElements = this._getDomElements<HTMLDivElement>('div');
        toolElements = [...toolElements].filter(elem => elem.classList.contains('tool'));
        for(let t of toolElements){
            t.addEventListener('click', () => this._toolActivated(t))
        } 
    }

    private _toolActivated(elem){
        elem;
    }
}
customElements.define('node-projects-designer-tool-bar', DesignerToolBar);