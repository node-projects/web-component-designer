import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';
import { PaletteBase } from './palette-base.js';

import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/iron-ajax/iron-ajax.js';
import './palette-shared-styles.js';

@customElement('palette-elements')
export class ElementsView extends PaletteBase(PolymerElement) {
  namesToPackages : Object;

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
      <iron-ajax auto="" url="elements.json" handle-as="json" on-response="_elementsReady"></iron-ajax>
    `;
  }

  ready() {
    super.ready();
    this.namesToPackages = {};
  }

  _elementsReady(event) {
    // First, some elements have sub-elements in the same package.
    let subElements = event.detail.response.subelements;
    let list = event.detail.response;

    for (let p in list) {
      this.namesToPackages[p] = p;
    }

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
    this.elements = Object.keys(list).concat(subelements).sort();

    this.dispatchEvent(new CustomEvent('package-names-ready', {detail: {list: this.namesToPackages, node: this}}));
    //Base.fire('package-names-ready', {list: this.namesToPackages}, {node: this});
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
}
