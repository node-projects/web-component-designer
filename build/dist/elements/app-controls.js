var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { PolymerElement } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { html } from "../../node_modules/@polymer/polymer/lib/utils/html-tag.js";
import { customElement, property } from "../../node_modules/@polymer/decorators/lib/decorators.js";
import "../../node_modules/@polymer/iron-icon/iron-icon.js";
import './app-icons.js';
let AppControls = class AppControls extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
        }
        button {
          background-color: transparent;
          color: white;
          border: none;
          cursor: pointer;
          transition: all .05s ease-in;
        }
        button[disabled] {
          opacity: 0.3;
          pointer-events: none;
        }
        button:hover {
          transform: scale(1.1);
        }
        .separator {
          border-left: var(--light-grey) solid 1px;
          opacity: .8;
          height: 24px;
          margin: 8px;
        }
      </style>
      <button on-click="undo" id="undoBtn" disabled="" title="Undo">
        <iron-icon icon="designer:undo"></iron-icon>
        <div>Undo</div>
      </button>
      <button on-click="redo" id="redoBtn" disabled="" title="Redo">
        <iron-icon icon="designer:redo"></iron-icon>
        <div>Redo</div>
      </button>
    `;
  }

  update(undos, redos) {
    this.$.undoBtn.disabled = undos === 0;
    this.$.redoBtn.disabled = redos === 0;
  }

  new() {
    this.appShell.new();
  }

  undo() {
    this.actionHistory.undo();
  }

  redo() {
    this.actionHistory.redo();
  }

};

__decorate([property({
  type: Array
})], AppControls.prototype, "actionHistory", void 0);

__decorate([property({
  type: Object
})], AppControls.prototype, "appShell", void 0);

AppControls = __decorate([customElement('app-controls')], AppControls);
export { AppControls };