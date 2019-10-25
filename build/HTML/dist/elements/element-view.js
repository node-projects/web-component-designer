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
import './element-stuff-styles.js';
import './element-stuff-flex.js';
import './element-stuff-properties.js';
let ElementView = class ElementView extends PolymerElement {
  constructor() {
    super(...arguments);
    this.selected = 'properties';
  }

  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        iron-pages {
          overflow: hidden;
          height: 250px;
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
        <designer-tab name="properties">
          <button>Properties</button>
        </designer-tab>
        <designer-tab name="styles">
          <button>Styles</button>
        </designer-tab>
        <designer-tab name="flex">
          <button>Flex</button>
        </designer-tab>
      </designer-tabs>

      <iron-pages attr-for-selected="name" selected-attribute="visible" selected="[[selected]]">
        <element-stuff-properties name="properties" id="propertiesContainer"></element-stuff-properties>
        <element-stuff-styles name="styles" id="stylesContainer"></element-stuff-styles>
        <element-stuff-flex name="flex" id="flexContainer"></element-stuff-flex>
      </iron-pages>
    `;
  }
  /**
   * Updates the views.
   */


  display(el) {
    let computedStyle = window.getComputedStyle(el);
    this.$.propertiesContainer.display(el);
    this.$.stylesContainer.display(computedStyle, el);
    this.$.flexContainer.display(computedStyle);
  }

  displayPosition(top, left) {
    this.$.stylesContainer.display('', {
      top: top + 'px',
      left: left + 'px'
    });
  }

};

__decorate([property({
  type: String
})], ElementView.prototype, "selected", void 0);

ElementView = __decorate([customElement('element-view')], ElementView);
export { ElementView }; //# sourceMappingURL=element-view.js.map