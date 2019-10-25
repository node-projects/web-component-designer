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
import "../../node_modules/@polymer/paper-card/paper-card.js";
import "../../node_modules/@polymer/iron-icon/iron-icon.js";
import "../../node_modules/@polymer/iron-icons/communication-icons.js";
import "../../node_modules/@polymer/paper-icon-button/paper-icon-button.js";
import "../../node_modules/@polymer/paper-button/paper-button.js";
let PaperCardActionsSample = class PaperCardActionsSample extends PolymerElement {
  static get template() {
    return html`
      <paper-card
        style="width: 300px"
        heading="Emmental"
        image="http://placehold.it/350x150/FFC107/000000" alt="Emmental">
        <div class="card-content">
          Emmentaler or Emmental is a yellow, medium-hard cheese that originated in the area around Emmental, Switzerland. It is one of the cheeses of Switzerland, and is sometimes known as Swiss cheese.
        </div>
        <div class="card-actions">
          <paper-button>Share</paper-button>
          <paper-button>Explore!</paper-button>
        </div>
      </paper-card>
    `;
  }

};
PaperCardActionsSample = __decorate([customElement("paper-card-actions-sample")], PaperCardActionsSample);
export { PaperCardActionsSample };