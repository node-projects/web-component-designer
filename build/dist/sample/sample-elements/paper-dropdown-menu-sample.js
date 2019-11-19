var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { PolymerElement } from "../../../node_modules/@polymer/polymer/polymer-element.js";
import { html } from "../../../node_modules/@polymer/polymer/lib/utils/html-tag.js";
import { customElement } from "../../../node_modules/@polymer/decorators/lib/decorators.js";
import "../../../node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu.js";
import "../../../node_modules/@polymer/paper-listbox/paper-listbox.js";
import "../../../node_modules/@polymer/paper-item/paper-item.js";
let PaperDropdownMenuSample = class PaperDropdownMenuSample extends PolymerElement {
  static get template() {
    return html`
      <paper-dropdown-menu label="Dinosaurs">
        <paper-listbox slot="dropdown-content" selected="1">
          <paper-item>allosaurus</paper-item>
          <paper-item>brontosaurus</paper-item>
          <paper-item>carcharodontosaurus</paper-item>
          <paper-item>diplodocus</paper-item>
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }

};
PaperDropdownMenuSample = __decorate([customElement("paper-dropdown-menu-sample")], PaperDropdownMenuSample);
export { PaperDropdownMenuSample };