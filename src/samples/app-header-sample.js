/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { html } from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';

class AppHeaderSample extends PolymerElement {
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

  static get is() { return 'app-header-sample'; }
}
customElements.define(AppHeaderSample.is, AppHeaderSample);
