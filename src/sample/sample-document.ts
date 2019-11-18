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
          <designer-tab-control selected-index="0">              
            <canvas-view title="Designer" name="designer" id="canvasView" style="height:100%"></canvas-view>
            <div title="Preview" name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
            <demo-view title="Code" id="demoView" name="preview"></demo-view>
          </designer-tab-control>              
        </div>`;
  }

  constructor(serviceContainer: ServiceContainer) {
    super();
    this._canvasView = this._shadow.getElementById('canvasView') as CanvasView;
    this._canvasView.serviceContainer = serviceContainer;
  }

  public get instanceServiceContainer() : InstanceServiceContainer {
    return this._canvasView.instanceServiceContainer;
  }

  /*private _viewDemo() {
      //@ts-ignore
      if (!window.codeView.get)
          return;
      //@ts-ignore
      (this.$.demoView as DemoView).display(window.codeView.get());
  }

  private _viewCode() {
      this.dispatchEvent(new CustomEvent('update-code', { bubbles: true, composed: true, detail: { target: this.$.viewContainer, node: this } }));
  }*/
}

customElements.define("sample-document", SampleDocument);