import { html } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';

export class PointerToolPopup extends AbstractBaseToolPopup {

  static override template = html`
        <div class="container">
          <header><h2 id="title">Pointer &amp; Pan</h2></header>
          <main id="content-area">
            <div class="tools">
              <button type="button" class="tool" data-command="setTool" data-command-parameter="Pointer" title="Pointer" style="--tool-icon: url('${assetsPath}images/tools/PointerTool.svg');"></button>
              <button type="button" class="tool" data-command="setTool" data-command-parameter="Pan" title="Pan" style="--tool-icon: url('${assetsPath}images/tools/PanTool.svg');"></button>
            </div>
          </main>
        </div>`;
}

customElements.define('node-projects-designer-pointer-tool-popup', PointerToolPopup);