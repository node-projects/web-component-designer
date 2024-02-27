import { IDemoView } from './IDemoView.js';
import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';

export class DemoView extends BaseCustomWebComponentLazyAppend implements IDemoView, IUiCommandHandler, IDisposable {

  private _placeholder: HTMLDivElement;
  private _loading: HTMLDivElement;

  static override readonly style = css`
  :host {
    display: block;
    overflow: hidden;
    background: white;
    height: 100%;
    width: 100%;
    position: relative;
  }
  #placeholder {
    position: absolute;
    left: 24px;
    height: 100%;
    width: calc(100% - 24px);
  }
  #loading {
    position: absolute;
    top: 60px;
    left: 20px;
  }
  #left {
    position:absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 24px;
    border-right: solid white 1px;
    box-sizing: border-box;
    background: black;
  }
  span {
    color: white;
    rotate: 270deg;
    display: block;
    position: absolute;
    top: 35px;
    left: -38px;
    font-weight: 600;
    font-family: monospace;
    font-size: 24px;
  }`;

  constructor() {
    super();

    this._placeholder = document.createElement('div');
    this._placeholder.id = 'placeholder';
    this._placeholder.style.transform = 'scale(1)'; //to fix position: static alignment
    this.shadowRoot.appendChild(this._placeholder)
    this._loading = document.createElement('div');
    this._loading.id = 'loading';
    this._loading.textContent = '🛀 Hold on, loading...';
    this.shadowRoot.appendChild(this._loading);
    const div = document.createElement("div");
    div.id = "left"
    const span = document.createElement("span");
    span.innerText = "PREVIEW";
    div.appendChild(span);
    this.shadowRoot.appendChild(div);
  }

  dispose(): void {
  }

  executeCommand: (command: IUiCommand) => void;
  canExecuteCommand: (command: IUiCommand) => boolean;

  async display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string) {
    this._loading.hidden = false;
    await serviceContainer.demoProviderService.provideDemo(this._placeholder, serviceContainer, instanceServiceContainer, code, style);
    this._loading.hidden = true;
  }
}

customElements.define('node-projects-demo-view', DemoView);