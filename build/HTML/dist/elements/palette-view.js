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
import "../../node_modules/@polymer/iron-pages/iron-pages.js";
import './designer-tabs.js';
import './designer-tab.js';
import './palette-elements.js';
import './palette-native.js';
import './palette-samples.js';
let PaletteView = class PaletteView extends PolymerElement {
  constructor() {
    super(...arguments);
    this.selected = 'native';
  }

  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        iron-pages {
          flex: 1;
          overflow: hidden;
          padding-bottom: 20px;
          background: var(--medium-grey);
          color: white;
        }
        button:hover {
          box-shadow: inset 0 3px 0 var(--light-grey);
        }
        button:focus {
          box-shadow: inset 0 3px 0 var(--highlight-pink);
        }
      </style>
      <designer-tabs attr-for-selected="name" selected="{{selected}}">
        <designer-tab name="native">
          <button>Native</button>
        </designer-tab>
        <designer-tab name="elements">
          <button>Custom</button>
        </designer-tab>
        <designer-tab name="samples">
          <button>Samples</button>
        </designer-tab>
      </designer-tabs>
      <iron-pages selected="[[selected]]" attr-for-selected="name" selected-attribute="visible">
        <palette-native name="native" id="native"></palette-native>
        <palette-elements name="elements"></palette-elements>
        <palette-samples name="samples"></palette-samples>
      </iron-pages>
    `;
  }

  isNativeElement(tag) {
    return this.$.native.elements.indexOf(tag) !== -1;
  }

};

__decorate([property({
  type: String
})], PaletteView.prototype, "selected", void 0);

PaletteView = __decorate([customElement('palette-view')], PaletteView);
export { PaletteView }; //# sourceMappingURL=palette-view.js.map