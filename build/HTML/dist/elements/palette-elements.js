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
import { PaletteBase } from './palette-base.js';
import "../../node_modules/@polymer/polymer/lib/elements/dom-repeat.js";
import "../../node_modules/@polymer/iron-ajax/iron-ajax.js";
import './palette-shared-styles.js';
let ElementsView = class ElementsView extends PaletteBase(PolymerElement) {
  static get template() {
    return html`
      <style include="palette-shared-styles"></style>

      <!-- A typeahead search -->
      <input list="list" placeholder="Filter Custom Elements" id="filter">
      <datalist id="list">
        <dom-repeat items="[[elements]]">
          <template>
            <option value="[[item]]">
          </option></template>
        </dom-repeat>
      </datalist>

      <!-- The list of clickable buttons -->
      <dom-repeat items="[[elements]]">
        <template>
          <button>[[item]]</button>
        </template>
      </dom-repeat>
      <iron-ajax auto="" url="./elements.json" handle-as="json" on-response="_elementsReady"></iron-ajax>
    `;
  }

  ready() {
    super.ready();
    this.namesToPackages = new Map();
  }

  _elementsReady(event) {
    // First, some elements have sub-elements in the same package.
    let subElements = event.detail.response.subelements;
    let subelements = [];

    for (let parent in subElements) {
      for (let i = 0; i < subElements[parent].length; i++) {
        subelements.push(`${parent}/${subElements[parent][i]}`);
        let packageName = parent;

        if (parent === 'app-layout') {
          packageName = parent + '/' + subElements[parent][i];
        }

        this.namesToPackages[subElements[parent][i]] = packageName;
      }
    }

    this.elements = subelements.sort();
    this.dispatchEvent(new CustomEvent('package-names-ready', {
      bubbles: true,
      composed: true,
      detail: {
        list: this.namesToPackages,
        node: this
      }
    }));
  }

  _doClick(target, kind) {
    // maybe it's a package/subpackage kind of thing.
    let matches = kind.match(/(.*)\/(.*)/);

    if (matches && matches.length === 3) {
      kind = matches[2];
    }

    this.maybeDoHTMLImport(kind, this.namesToPackages[kind]);
  }

  maybeDoHTMLImport(kind, packageName) {
    if (packageName === undefined) {
      // Oof, someone didn't know what element this was. Find it in the list.
      packageName = this.namesToPackages[kind];
    }

    this._fireEvent('new-element', kind, packageName, '');
  }

};
ElementsView = __decorate([customElement('palette-elements')], ElementsView);
export { ElementsView }; //# sourceMappingURL=palette-elements.js.map