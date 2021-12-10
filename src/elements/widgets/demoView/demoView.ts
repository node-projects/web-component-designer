import { IDemoView } from "./IDemoView";
import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from "../../services/ServiceContainer";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer";

export class DemoView extends BaseCustomWebComponentLazyAppend implements IDemoView {

  private _placeholder: HTMLDivElement;
  private _loading: HTMLDivElement;

  static override readonly style = css`
  :host {
    display: block;
    overflow: hidden;
    background: white;
    height: 100%;
    width: 100%;
  }
  #placeholder {
    height: 100%;
    width: 100%;
  }
  #loading {
    position: absolute;
    top: 60px;
    left: 20px;
  }`;

  constructor() {
    super();

    this._placeholder = document.createElement('div');
    this._placeholder.id = 'placeholder';
    this.shadowRoot.appendChild(this._placeholder)
    this._loading = document.createElement('div');
    this._loading.id = 'loading';
    this._loading.textContent = '🛀 Hold on, loading...';
    this.shadowRoot.appendChild(this._loading)
  }

  async display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string) {
    this._loading.hidden = false;
    await serviceContainer.demoProviderService.provideDemo(this._placeholder, serviceContainer, instanceServiceContainer, code);
    this._loading.hidden = true;
  }
}

customElements.define('node-projects-demo-view', DemoView);