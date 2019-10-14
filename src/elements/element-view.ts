import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement, property } from '@polymer/decorators';

import '@polymer/iron-pages/iron-pages.js';
import './designer-tabs.js';
import './designer-tab.js';
import './element-stuff-styles.js';
import './element-stuff-flex.js';
import './element-stuff-properties.js';
import { ElementProperties } from './element-stuff-properties.js';
import { ElementStyles } from './element-stuff-styles.js';
import { ElementFlex } from './element-stuff-flex.js';

@customElement('element-view')
export class ElementView extends PolymerElement {
  @property({ type: String })
  selected = 'properties';

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
    (this.$.propertiesContainer as ElementProperties).display(el);
    (this.$.stylesContainer as ElementStyles).display(computedStyle, el);
    (this.$.flexContainer as ElementFlex).display(computedStyle);
  }

  displayPosition(top, left) {
    (this.$.stylesContainer as ElementStyles).display('', {top: top + 'px', left: left + 'px'});
  }
}
