var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { PolymerElement } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { html } from "../../node_modules/@polymer/polymer/lib/utils/html-tag.js";
import { customElement } from "../../node_modules/@polymer/decorators/lib/decorators.js";
import "../../node_modules/@polymer/iron-pages/iron-pages.js";
import "../../node_modules/@polymer/paper-tabs/paper-tabs.js";
import "../../node_modules/@polymer/paper-tabs/paper-tab.js";
let IronPagesSample = class IronPagesSample extends PolymerElement {
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

};
IronPagesSample = __decorate([customElement("iron-pages-sample")], IronPagesSample);
export { IronPagesSample };