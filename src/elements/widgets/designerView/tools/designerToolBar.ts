import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { assetsPath } from "../../../../Constants.js";
import { IDesignerCanvas } from "../IDesignerCanvas.js";

interface IToolHelper {
    selectedToolElement: HTMLElement,
    isMultiTool: boolean,
    previewElement?: HTMLElement;
}

export class DesignerToolBar extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    .toolbar-host{
        background: rgb(47, 53, 69);
        width: 100%;
        height: 100%;
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        overflow: visible;
        place-content: flex-start left;
    }

    .tool {
        height: 32px;
        width: 32px;
        background-color: rgb(255, 255, 255);
        border-radius: 5px;
        margin: 2px 2px 2px 0px;
        background-size: 70%;
        background-repeat: no-repeat;
        background-position: center center;
        flex-shrink: 0;
        border: 1px solid black;
    }

    .multi-tool {
        overflow: visible;
    }

    .tool.selected {
        background-color: green;
    }

    .tool:hover {
        cursor: pointer;
    }

    .multi-tool-container {
        display: none;
        justify-content: flex-start;
        flex-direction: row;
        overflow: visible;
    }

    .multi-tool-preview {
    }
`;

    static override readonly template = html`
    <div id="toolbar-host" class="toolbar-host">
        <div class="single-tool tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer Tool"
            style="background-image: url('${assetsPath}images/layout/PointerTool.svg');"></div>
            <div class="multi-tool" multi-tool="Select">
                <div class="multi-tool-preview tool"></div>
                <div class="multi-tool-container closed">
                    <div class="tool" data-command="setTool" data-command-parameter="MagicWandSelector" title="Magic Wand Selector" style="background-image: url('${assetsPath}images/layout/MagicWandTool.svg');"></div>
                    <div class="tool" data-command="setTool" data-command-parameter="RectangleSelector" title="Rectangle Selector" style="background-image: url('${assetsPath}images/layout/SelectRectTool.svg');"></div>
            </div>
        </div>
        <div class="multi-tool" multi-tool="Draw">
            <div class="multi-tool-preview tool"></div>
            <div class="multi-tool-container closed">
                <div class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
                <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
                <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
                <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
            </div>
        </div>
        <div class="single-tool tool" data-command="setTool" data-command-parameter="Zoom" title="Zoom Tool"
            style="background-image: url('${assetsPath}images/layout/ZoomTool.svg');">
        </div>
        <div class="single-tool tool" data-command="setTool" data-command-parameter="Text" title="Text Tool"
            style="background-image: url('${assetsPath}images/layout/TextTool.svg');">
        </div>
        <div class="single-tool tool" data-command="setTool" data-command-parameter="TextBoc" title="Textbox Tool"
            style="background-image: url('${assetsPath}images/layout/TextBoxTool.svg');">
        </div>
    </div>`;

    public static properties = {
        orientation: String,
    }

    _toolHelper: IToolHelper;
    _designerCanvas: IDesignerCanvas;
    _toolbarHost: HTMLDivElement;
    orientation: 'vertical' | 'horizontal' = 'vertical';

    constructor() {
        super();  
        console.log(new URL((import.meta.url)))     ;
    }

    public setup(designerCanvas: IDesignerCanvas) {
        this._designerCanvas = designerCanvas;
    }

    ready() {
        this._toolbarHost = this._getDomElement<HTMLDivElement>('toolbar-host');
        this._registerTools();
        this._setStandardTool();
    }

    private _setStandardTool() {
        let toolElements = this._toolbarHost.querySelectorAll<HTMLDivElement>('div.single-tool')
        let elem = [...toolElements].find(elem => elem.dataset["commandParameter"] == "Pointer");
        this._toolHelper = {
            selectedToolElement: elem,
            isMultiTool: false,
        }

        this._markAsSelected(this._toolHelper);
    }

    private _registerTools() {
        let toolElements = this._toolbarHost.querySelectorAll<HTMLDivElement>('div.single-tool')
        for (let t of toolElements) {
            t.addEventListener('click', () => this._singleToolSelected(t))
        }

        let multiToolElemetns = this._toolbarHost.querySelectorAll<HTMLDivElement>('div.multi-tool');
        for (let mT of multiToolElemetns) {
            mT.addEventListener('click', () => this._multiToolPressed(mT));
        }
    }

    private _singleToolSelected(elem: HTMLDivElement) {
        if (this._toolHelper.selectedToolElement != null) this._markAsUnselected(this._toolHelper);

        this._toolHelper = {
            selectedToolElement: elem,
            isMultiTool: false,
        }

        this._markAsSelected(this._toolHelper);
        this._closeOpenMultiTools()
    }

    private _multiToolPressed(mTHost: HTMLDivElement) {
        let mTContainer = mTHost.querySelector<HTMLDivElement>('div.multi-tool-container');
        let mTPreview = mTHost.querySelector<HTMLDivElement>('div.multi-tool-preview');
        let toolsOfContainer = mTContainer.querySelectorAll<HTMLDivElement>('div.tool');

        if (mTContainer.classList.contains('closed')) {
            for (let t of toolsOfContainer) {
                t.addEventListener("click", () => this._multiToolSelected(mTHost.dataset['multi-tool'], t, mTPreview));
            }

            mTContainer.style.display = "flex";
            mTPreview.style.display = "none";

            mTContainer.classList.remove('closed');
            mTContainer.classList.add('opened');
        } else {
            mTContainer.style.display = "none";
            mTPreview.style.display = "block";

            for (let t of toolsOfContainer) {
                t.removeEventListener('Click', () => this._multiToolSelected);
            }

            mTContainer.classList.remove('opened');
            mTContainer.classList.add('closed');
        }
    }

    private _multiToolSelected(multi_tool: string, elem: HTMLElement, preview: HTMLDivElement) {
        if (this._toolHelper.selectedToolElement != null) this._markAsUnselected(this._toolHelper);
        this._toolHelper = {
            selectedToolElement: elem,
            isMultiTool: true,
            previewElement: preview,
        }
        preview.style.backgroundImage = elem.style.backgroundImage;
        this._markAsSelected(this._toolHelper);
    }

    private _markAsSelected(toolHelper: IToolHelper) {
        let color = "green";
        this._markToolInternal(toolHelper, color)
    }

    private _markAsUnselected(toolHelper: IToolHelper) {
        let color = "white";
        this._markToolInternal(toolHelper, color)
    }

    private _markToolInternal(toolHelper: IToolHelper, color: string) {
        toolHelper.selectedToolElement.style.backgroundColor = color;
        if (toolHelper.isMultiTool) toolHelper.previewElement.style.backgroundColor = color;
    }

    private _closeOpenMultiTools() {
        let toolElements = [...this._toolbarHost.querySelectorAll<HTMLDivElement>('div.multi-tool-container')].filter(elem => elem.classList.contains('opened'));
        for (let t of toolElements) {
            t.style.display = "none";
            t.parentElement.querySelector<HTMLDivElement>('div.multi-tool-preview').style.display = "block";

            t.classList.remove('opened');
            t.classList.add('closed');
        }
    }
}
customElements.define('node-projects-designer-tool-bar', DesignerToolBar);