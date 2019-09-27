/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/iron-ajax/iron-ajax.js';
import './palette-shared-styles.js';
import './palette-base.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/*
 * List of elements that can be added to the view.
 * This list is generated from the `devDependencies` field of this
 * app's bower.json
 */
class NativeView extends PaletteBase(PolymerElement) {
  static get template() {
    return html`
      <style include="palette-shared-styles"></style>

      <!-- A typeahead search -->
      <input list="list" placeholder="Filter Native Elements" id="filter">
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

      <iron-ajax auto="" url="elements-native.json" handle-as="json" on-response="_elementsReady"></iron-ajax>
    `;
  }

  static get is() { return 'palette-native'; }

  _doClick(target, kind) {
    this._fireEvent('new-element', kind);
  }
}
customElements.define(NativeView.is, NativeView);
