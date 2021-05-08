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
  }
  iframe {
    width: 100%;
    height: 100%;
    border: none;
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

  display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string) {
    let iframe = document.createElement('iframe');
    this._placeholder.innerHTML = '';
    this._placeholder.appendChild(iframe);
    this._loading.hidden = false;

    iframe.onload = () => {
      this._loading.hidden = true;
    };

    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<script type="module">');
    for (let i of instanceServiceContainer.designContext.imports) {
      doc.write("import '" + i + "';");
    }
    doc.write("document.body.style.display='';");
    doc.write('</script>');
    doc.write('<body style="display:none">' + code + '</body>');
    doc.close();
  }
}

customElements.define('node-projects-demo-view', DemoView);