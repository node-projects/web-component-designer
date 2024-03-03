import { html } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';

export class SelectionToolPopup extends AbstractBaseToolPopup {

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Selection</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="RectangleSelector" title="Rectangle Selector" style="background-image: url('${assetsPath}images/tools/SelectRectTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="MagicWandSelector" title="Magic Wand Selector" style="background-image: url('${assetsPath}images/tools/MagicWandTool.svg');"></div>
            </div>
          </main>
        </div>`;
}

customElements.define('node-projects-designer-selection-tool-popup', SelectionToolPopup);