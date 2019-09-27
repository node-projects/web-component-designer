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
import './element-stuff-styles.js';
import './element-stuff-flex.js';
import './element-stuff-properties.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

class ElementView extends PolymerElement {
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

  static get is() { return 'element-view'; }

  static get properties() {
    return {
      selected: {
        type: String,
        value: 'properties'
      }
    }
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
    this.$.stylesContainer.display({top: top + 'px', left: left + 'px'});
  }
}
customElements.define(ElementView.is, ElementView);
