import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';
import { PaletteBase } from './palette-base.js';

import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/iron-ajax/iron-ajax.js';
import './palette-shared-styles.js';
import './palette-base.js';

/*
 * List of elements that can be added to the view.
 * This list is generated from the `devDependencies` field of this
 * app's package.json
 */
@customElement('palette-native')
export class NativeView extends PaletteBase(PolymerElement) {
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

  _doClick(target, kind) {
    this._fireEvent('new-element', kind, '', '');
  }
}
