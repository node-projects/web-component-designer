import { BaseCustomWebComponent, html, css } from "../elements/controls/BaseCustomWebComponent";
import { CanvasView } from '../elements/canvas-view';
import { ServiceContainer } from '../elements/services/ServiceContainer';
import { InstanceServiceContainer } from '../elements/services/InstanceServiceContainer';

export class SampleDocument extends BaseCustomWebComponent {

  mainPage = 'designer';
  _canvasView: CanvasView;

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
          <node-projects-designer-tab-control selected-index="0">              
            <node-projects-canvas-view title="Designer" name="designer" id="canvasView" style="height:100%"></node-projects-canvas-view>
            <div title="Preview" name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
            <node-projects-demo-view title="Code" id="demoView" name="preview"></node-projects-demo-view>
          </node-projects-designer-tab-control>              
        </div>`;
  }

  constructor(serviceContainer: ServiceContainer) {
    super();
    this._canvasView = this.shadowRoot.getElementById('canvasView') as CanvasView;
    this._canvasView.serviceContainer = serviceContainer;
  }

  public get instanceServiceContainer() : InstanceServiceContainer {
    return this._canvasView.instanceServiceContainer;
  }
}

customElements.define("node-projects-sample-document", SampleDocument);