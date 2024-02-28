import { html } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';

export class PointerToolPopup extends AbstractBaseToolPopup {

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Selection</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer" style="background-image: url('${assetsPath}images/tools/PointerTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="Pan" title="Pan" style="background-image: url('${assetsPath}images/tools/PanTool.svg');"></div>
            </div>
          </main>
        </div>`;
}

customElements.define('node-projects-designer-pointer-tool-popup', PointerToolPopup);