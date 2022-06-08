import { html, BaseCustomWebComponentConstructorAppend, css } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { DesignerToolbar } from '../DesignerToolbar.js';

export class DrawToolPopup extends BaseCustomWebComponentConstructorAppend {

  static override style = css`
      .container {
          width: 150px;
          min-height: 200px;
          color: white;
          background-color: rgb(64, 64, 64);
          border: 1px solid black;
      }
      header {
          text-align: center;
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
      .tools {
          display: flex;
          flex-wrap: wrap;
      }`

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Draw</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="PickColor" title="Pick Color" style="background-image: url('${assetsPath}images/layout/ColorPickerTool.svg');"></div>
            </div>
          </main>
        </div>`;

  constructor() {
    super();

    for (let e of [...this.shadowRoot.querySelectorAll("div.tool")]) {
      let div = (<HTMLDivElement>e);
      div.onclick = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setTool(div.dataset['commandParameter']);
    }
  }
}

customElements.define('node-projects-designer-drawtool-popup', DrawToolPopup);