import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';

@customElement("app-header-sample")
export class AppHeaderSample extends PolymerElement {
  static get template() {
    return html`
      <app-header style="background-color: #4285f4;color:white" condenses reveals effects="waterfall">
        <app-toolbar>
          <div spacer main-title>My App</div>
        </app-toolbar>
      </app-header>
      <div style="box-sizing:border-box;height:100%;width:100%;padding:10px"></div>
    `;
  }
}
