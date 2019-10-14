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

import { html } from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/communication-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-button/paper-button.js';

class PaperCardActionsSample extends PolymerElement {
  static get template() {
    return html`
      <paper-card
        style="width: 300px"
        heading="Emmental"
        image="http://placehold.it/350x150/FFC107/000000" alt="Emmental">
        <div class="card-content">
          Emmentaler or Emmental is a yellow, medium-hard cheese that originated in the area around Emmental, Switzerland. It is one of the cheeses of Switzerland, and is sometimes known as Swiss cheese.
        </div>
        <div class="card-actions">
          <paper-button>Share</paper-button>
          <paper-button>Explore!</paper-button>
        </div>
      </paper-card>
    `;
  }

  static get is() { return 'paper-card-actions-sample'; }
}
customElements.define(PaperCardActionsSample.is, PaperCardActionsSample);
