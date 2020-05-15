import { IDemoView } from "./IDemoView";
import { BaseCustomWebComponent, css } from '../../controls/BaseCustomWebComponent';

export class DemoView extends BaseCustomWebComponent implements IDemoView {

  private _placeholder: HTMLDivElement;
  private _loading: HTMLDivElement;

  static readonly style=css`
  :host {
    display: block;
    overflow: hidden;
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
  }
  iframe {
    width: 100%;
    height: 100%;
  }
  `;

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

  display(code: string) {

    let iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    this._placeholder.innerHTML = '';
    this._placeholder.appendChild(iframe);
    this._loading.hidden = false;

    iframe.onload = () => {
      this._loading.hidden = true;
    };

    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
  }
}

customElements.define('node-projects-demo-view', DemoView);