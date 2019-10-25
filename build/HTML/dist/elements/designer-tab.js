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
let DesignerTab = class DesignerTab extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
          position: relative;
          color: white;
        }
        :host([disabled]) {
          opacity: 0.3;
          pointer-events: none;
        }

        :host ::slotted(*) {
          display: inline-block;
          background-color: transparent;
          border: none;
          padding: 11px 13px;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 500;
          text-decoration: none;
          text-transform: uppercase;
          line-height: 1.5;
          color: inherit;
          outline: none;
          cursor: pointer;
          transition: box-shadow .1s ease-in;
        }
        :host(.iron-selected) ::slotted(*) {
          pointer-events: none;
          background: var(--medium-grey);
          box-shadow: inset 0 3px 0 var(--highlight-pink);
        }
      </style>
      <slot></slot>
    `;
  }

};
DesignerTab = __decorate([customElement('designer-tab')], DesignerTab);
export { DesignerTab }; //# sourceMappingURL=designer-tab.js.map