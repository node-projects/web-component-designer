import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';
import { PaletteBase } from './palette-base.js';

import '@polymer/iron-ajax/iron-ajax.js';
import './palette-shared-styles.js';
import './palette-base.js';

/*
 * List of custom templates that can be added to the view.
 */
@customElement('palette-samples')
export class SamplesView extends PaletteBase(PolymerElement) {
  static get template() {
    return html`
      <style include="palette-shared-styles"></style>

      <!-- A typeahead search -->
      <input list="list" placeholder="Filter Samples" id="filter">
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

      <iron-ajax auto="" url="./elements-samples.json" handle-as="json" on-response="_elementsReady"></iron-ajax>
    `;
  }

  async _doClick(_, kind) {
    this._fireEvent('new-sample', kind, '', '');

    /*Base.import(url, function(e) {
      let doc = e.target.import;
      let template = doc.querySelector('template');
      this._fireEvent('new-sample', kind, '', template);
    }.bind(this));*/
  }
}
