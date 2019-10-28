import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

import '@polymer/iron-pages/iron-pages.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';

@customElement("iron-pages-sample")
export class IronPagesSample extends PolymerElement {
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
}
