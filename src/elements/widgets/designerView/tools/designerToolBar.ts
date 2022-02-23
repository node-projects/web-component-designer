import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class DesignerToolBar extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
:host {
display: block;
}
    .outer{
        background: #2f3545;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: black;
        border-width: 1px;
        border-top-style: solid;
        border-right-style: solid;
        border-bottom-style: solid;
        
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        align-items: center;
        padding-top: 5px;
        gap: 5px;
    }
    .outer > div {
        background: #eeefef;
        width: 28px;
        height: 28px;
        border-radius: 5px;
    }

        .outer > div > div {
        display: none;
}
`;

    static override readonly template = html`
<div class="outer">
    <div
        style="background-image: url('./assets/images/layout/PointerTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
    <div
        style="background-image: url('./assets/images/layout/MagicWandTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
    <div
        style="background-image: url('./assets/images/layout/DrawLineTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
    <div
        style="background-image: url('./assets/images/layout/DrawPathTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
    <div
        style="background-image: url('./assets/images/layout/DrawRectTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
    <div
        style="background-image: url('./assets/images/layout/DrawEllipTool.svg'); background-size: cover; background-size: 70%;background-repeat: no-repeat;background-position: center;">
    </div>
</div>`;

    public static properties = {
        orientation: String
    }

    orientation: 'vertical' | 'horizontal' = 'vertical';

    constructor() {
        super();
    }

    ready() {

    }
}
customElements.define('node-projects-designer-tool-bar', DesignerToolBar);