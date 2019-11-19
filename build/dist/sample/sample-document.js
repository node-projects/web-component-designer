import { BaseCustomWebComponent, html, css } from "../elements/controls/BaseCustomWebComponent.js";
export class SampleDocument extends BaseCustomWebComponent {
  constructor(serviceContainer) {
    super();
    this.mainPage = 'designer';
    this._canvasView = this._shadow.getElementById('canvasView');
    this._canvasView.serviceContainer = serviceContainer;
  }

  static get style() {
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
          <designer-tab-control selected-index="0">              
            <canvas-view title="Designer" name="designer" id="canvasView" style="height:100%"></canvas-view>
            <div title="Preview" name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
            <demo-view title="Code" id="demoView" name="preview"></demo-view>
          </designer-tab-control>              
        </div>`;
  }

  get instanceServiceContainer() {
    return this._canvasView.instanceServiceContainer;
  }

}
customElements.define("sample-document", SampleDocument);