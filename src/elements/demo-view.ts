import { customElement, LitElement, html, css } from 'lit-element';

@customElement('demo-view')
export class DemoView extends LitElement {

  _placeholder: HTMLDivElement;
  _loading: HTMLDivElement;

  static get styles() {
    return css`
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
      }`;
  }

  render() {
    return html`
      <div id="placeholder"></div>
      <div id="loading">🛀 Hold on, loading...</div>
    `;
  }

  firstUpdated() {
    this._placeholder = this.shadowRoot.getElementById('placeholder') as HTMLDivElement;
    this._loading = this.shadowRoot.getElementById('loading') as HTMLDivElement;
  }

  display(code) {

    let iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    this._placeholder.innerHTML = '';
    this._placeholder.appendChild(iframe);
    this._loading.hidden = false;

    iframe.onload = () => {
      this._loading .hidden = true;
    };

    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
  }
}
