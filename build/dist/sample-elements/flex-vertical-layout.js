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
let FlexVerticalLayout = class FlexVerticalLayout extends PolymerElement {
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

};
FlexVerticalLayout = __decorate([customElement("flex-vertical-layout")], FlexVerticalLayout);
export { FlexVerticalLayout };