import { DockSpawnTsWebcomponent } from "../../node_modules/dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent.js";
import { JsonElementsService } from "../elements/services/elementsService/JsonElementsService.js";
import { SampleDocument } from './sample-document.js';
import { BaseCustomWebComponent, html, css } from "../elements/controls/BaseCustomWebComponent.js";
import serviceContainer from "../elements/services/DefaultServiceBootstrap.js";
DockSpawnTsWebcomponent.cssRootDirectory = "./assets/css/";
export class AppShell extends BaseCustomWebComponent {
  constructor() {
    super();
    this.mainPage = 'designer';
    this._documentNumber = 0;
    this._dock = this._shadow.getElementById('dock');
    this._paletteView = this._shadow.getElementById('paletteView');
    this._treeView = this._shadow.getElementById('tree');
    this._attributeEditor = this._shadow.getElementById('attributeEditor');

    let newButton = this._shadow.getElementById('newButton');

    newButton.onclick = () => this.newDocument(); //@ts-ignore


    this._dockManager = this._dock.dockManager;

    this._dockManager.addLayoutListener({
      onActivePanelChange: (manager, panel) => {
        if (panel) {
          let element = panel.elementContent.assignedElements()[0];

          if (element.localName == "sample-document") {
            let sampleDocument = element;
            let selection = sampleDocument.instanceServiceContainer.selectionService.selectedElements;
            this._attributeEditor.selectedElements = selection;
          }
        }
      }
    });

    this._setupServiceContainer();

    this.newDocument();
  }

  static get style() {
    return css`
    :host {
      display: block;
      box-sizing: border-box;
      position: relative;

      /* Default colour scheme */
      --canvas-background: white;
      --almost-black: #141720;
      --dark-grey: #232733;
      --medium-grey: #2f3545;
      --light-grey: #383f52;
      --highlight-pink: #e91e63;
      --highlight-blue: #2196f3;
      --highlight-green: #99ff33;
      --input-border-color: #596c7a;
    }

    .app-header {
      background-color: var(--almost-black);
      color: white;
      height: 60px;
      width: 100%;
      position: fixed;
      z-index: 100;
      display: flex;
      font-size: var(--app-toolbar-font-size, 20px);
      align-items: center;
      font-weight: 900;
      letter-spacing: 2px;
      padding-left: 10px;
    }

    .app-body {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      padding-top: 60px;
      height: 100%;
    }

    .heavy {
      font-weight: 900;
      letter-spacing: 2px;
    }
    .lite {
      font-weight: 100;
      opacity: 0.5;
      letter-spacing: normal;
    }

    dock-spawn-ts > div {
      height: 100%;
    }

    attribute-editor {
      height: 100%;
      width: 100%;
    }
    `;
  }

  static get template() {
    return html`
      <div class="app-header">
        <span class="heavy">web-component-designer <span class="lite">// a design framework for web-components using web-components</span></span>
        <button id="newButton" style="margin-left: 50px;">new</button>
      </div>

      <div class="app-body">
        <dock-spawn-ts id="dock" style="width: 100%; height: 100%; position: relative;">
          
          <div title="Tree" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2" style="position: absolute;">
            <tree-view name="tree" id="treeView"></tree-view>
          </div>

          <div id="attributeDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <attribute-editor id="attributeEditor"></attribute-editor>
            <!--<canvas-controls id="canvasControls"></canvas-controls>
            <element-view id="elementView"></element-view>-->
          </div>
          <div title="Elements" dock-spawn-dock-type="down" dock-spawn-dock-to="attributeDock" dock-spawn-dock-ratio="0.4">
            <palette-view id="paletteView"></palette-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;
  }

  _setupServiceContainer() {
    serviceContainer.register('elementsService', new JsonElementsService('native', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements-native.json'));
    serviceContainer.register('elementsService', new JsonElementsService('samples', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements-samples.json'));
    serviceContainer.register('elementsService', new JsonElementsService('custom', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements.json'));

    this._paletteView.loadControls(serviceContainer.elementsServices);

    this._attributeEditor.serviceContainer = serviceContainer;
  }

  newDocument() {
    this._documentNumber++;
    let sampleDocument = new SampleDocument(serviceContainer);
    sampleDocument.title = "document-" + this._documentNumber;

    this._dock.appendChild(sampleDocument);
  }

}
window.customElements.define('app-shell', AppShell);