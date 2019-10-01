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

import '@polymer/iron-pages/iron-pages.js';
import './designer-tabs.js';
import './designer-tab.js';
import './palette-elements.js';
import './palette-native.js';
import './palette-samples.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

class PaletteView extends PolymerElement {
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

  static get is() { return 'palette-view'; }

  static get properties() {
    return {
      selected: {
        type: String,
        value: 'native'
      }
    }
  }

  isNativeElement(tag) {
    return this.$.native.elements.indexOf(tag) !== -1;
  }
}
customElements.define(PaletteView.is, PaletteView);
