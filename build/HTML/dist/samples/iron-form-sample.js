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
import "../../node_modules/@polymer/iron-form/iron-form.js";
import "../../node_modules/@polymer/paper-input/paper-input.js";
import "../../node_modules/@polymer/paper-checkbox/paper-checkbox.js";
import "../../node_modules/@polymer/paper-button/paper-button.js";
let IronFormSample = class IronFormSample extends PolymerElement {
  static get template() {
    return html`
      <iron-form style="background:white;padding:20px;">
        <h2>A sample form</h2>
        <form method="get" action="https://httpbin.org/get">
          <paper-input name="name" label="Your name" value="Batman"></paper-input>
          <paper-input name="food" label="Favourite snack" value="Donuts"></paper-input>
          <paper-checkbox name="cheese" value="yes" checked>I like cheese</paper-checkbox>
        </form>
        <br>
        <paper-button style="width:100%;margin:0;background:#03a9f4;color: white;"
            raised onclick="this.parentElement.submit()">Submit</paper-button>
      </iron-form>
    `;
  }

};
IronFormSample = __decorate([customElement("iron-form-sample")], IronFormSample);
export { IronFormSample };