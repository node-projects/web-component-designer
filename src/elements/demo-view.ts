import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

@customElement('demo-view')
export class DemoView extends PolymerElement {
  static get template() {
    return html`
      <style>
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
      </style>
      <div id="placeholder"></div>
      <div id="loading">🛀 Hold on, loading...</div>
    `;
  }

  display(code) {
    let iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    this.$.placeholder.innerHTML = '';
    this.$.placeholder.appendChild(iframe);
    (this.$.loading as HTMLDivElement).hidden = false;

    /*iframe.onload = function() {
      (this.$.loading as HTMLDivElement).hidden = true;
    }.bind(this);*/

    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
  }
}
