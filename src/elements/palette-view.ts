import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement, property } from '@polymer/decorators';

import '@polymer/iron-pages/iron-pages.js';
import './designer-tabs.js';
import './designer-tab.js';
import './palette-elements.js';
import './palette-native.js';
import './palette-samples.js';
import { NativeView } from './palette-native.js';

@customElement('palette-view')
export class PaletteView extends PolymerElement {
  @property({ type: String })
  selected = 'native';

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
    return (this.$.native as NativeView).elements.indexOf(tag) !== -1;
  }
}
