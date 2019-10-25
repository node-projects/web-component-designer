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
import "../../node_modules/@polymer/app-layout/app-header/app-header.js";
import "../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js";
let AppHeaderSample = class AppHeaderSample extends PolymerElement {
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

};
AppHeaderSample = __decorate([customElement("app-header-sample")], AppHeaderSample);
export { AppHeaderSample };