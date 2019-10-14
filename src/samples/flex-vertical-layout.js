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

class FlexVerticalLayout extends PolymerElement {
  static get template() {
    return html`
      <style>
        #flexVertical {
          display:flex;
          flex-direction:column;
          background:white;
          padding:10px;
          height:300px;
          width: 100px;
        }
        #flexVertical1, #flexVertical2, #flexVertical3 {
          width:50px;
          height:50px;
          border:2px solid #673AB7;
          margin:10px;
        }
      </style>
      <div id="flexVertical">
        <div id="flexVertical1">one</div>
        <div id="flexVertical2" style="flex:1">two</div>
        <div id="flexVertical3">three</div>
      </div>
    `;
  }

  static get is() { return 'flex-vertical-layout'; }
}
customElements.define(FlexVerticalLayout.is, FlexVerticalLayout);
