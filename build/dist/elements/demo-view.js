var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { customElement, LitElement, html, css } from "../../node_modules/lit-element/lit-element.js";
let DemoView = class DemoView extends LitElement {
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
    this._placeholder = this.shadowRoot.getElementById('placeholder');
    this._loading = this.shadowRoot.getElementById('loading');
  }

  display(code) {
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

};
DemoView = __decorate([customElement('demo-view')], DemoView);
export { DemoView };