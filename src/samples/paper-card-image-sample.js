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
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/communication-icons.js';

class PaperCardImageSample extends PolymerElement {
  static get template() {
    return html`
      <paper-card
        style="width:200px;margin:10px;"
        image="http://placehold.it/350x150/FFC107/000000" alt="Video thumbnail">
        <a id="paperCardLink" class="card-content" style="height:50px;overflow:auto;" target="_blank">
          Video title here
        </a>
      </paper-card>
    `;
  }

  static get is() { return 'paper-card-image-sample'; }
}
customElements.define(PaperCardImageSample.is, PaperCardImageSample);
