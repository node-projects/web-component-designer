import { BaseCustomWebComponent, html, css } from "../elements/controls/BaseCustomWebComponent.js";
export class SampleDocument extends BaseCustomWebComponent {
  constructor(serviceContainer) {
    super();
    this.mainPage = 'designer';
    this._canvasView = this.shadowRoot.getElementById('canvasView');
    this._canvasView.serviceContainer = serviceContainer;
  }

  static get astyle() {
    return css`
      div {
        height: 100%;
        display: flex;
        flex-direction: column;
      }                            
      canvas-view {
        overflow: auto;
      }`;
  }

  static get template() {
    return html`
        <div>
          <node-projects-designer-tab-control selected-index="0">              
            <node-projects-canvas-view title="Designer" name="designer" id="canvasView" style="height:100%"></node-projects-canvas-view>
            <div title="Preview" name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
            <node-projects-demo-view title="Code" id="demoView" name="preview"></node-projects-demo-view>
          </node-projects-designer-tab-control>              
        </div>`;
  }

  get instanceServiceContainer() {
    return this._canvasView.instanceServiceContainer;
  }

}
customElements.define("node-projects-sample-document", SampleDocument);