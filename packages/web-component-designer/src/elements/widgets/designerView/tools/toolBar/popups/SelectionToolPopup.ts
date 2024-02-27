import { html, BaseCustomWebComponentConstructorAppend, css } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { DesignerToolbar } from '../DesignerToolbar.js';

export class SelectionToolPopup extends BaseCustomWebComponentConstructorAppend {

  static override style = css`
      .container {
          width: 120px;
          min-height: 100px;
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
          margin-bottom: 5px;
          gap: 3px;
      }`

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Selection</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="RectangleSelector" title="Rectangle Selector" style="background-image: url('${assetsPath}images/layout/SelectRectTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="MagicWandSelector" title="Magic Wand Selector" style="background-image: url('${assetsPath}images/layout/MagicWandTool.svg');"></div>
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

customElements.define('node-projects-designer-selection-tool-popup', SelectionToolPopup);