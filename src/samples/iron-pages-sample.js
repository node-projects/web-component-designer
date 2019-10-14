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

import '@polymer/iron-pages/iron-pages.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';

class IronPagesSample extends PolymerElement {
  static get template() {
    return html`
      <style>
        #ironPagesSample1, #ironPagesSample2, #ironPagesSample3 {
          height:100px;
          padding:50px;
        }
        #ironPagesSample1 { background: #03A9F4; }
        #ironPagesSample2 { background: #FF9800; }
        #ironPagesSample3 { background: #4CAF50; }
      </style>
      <paper-tabs selected="{{_page}}">
        <paper-tab name="one">one</paper-tab>
        <paper-tab name="two">two</paper-tab>
        <paper-tab name="three">three</paper-tab>
      </paper-tabs>
      <iron-pages role="main" selected="[[_page]]" attr-for-selected="name" selected-attribute="visible">
        <div id="ironPagesSample1" name="one">page one</div>
        <div id="ironPagesSample2" name="two">page two</div>
        <div id="ironPagesSample3" name="three">page three</div>
      </iron-pages>
    `;
  }

  static get is() { return 'iron-pages-sample'; }
}
customElements.define(IronPagesSample.is, IronPagesSample);
