import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/communication-icons.js';

@customElement("paper-card-image-sample")
export class PaperCardImageSample extends PolymerElement {
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
}
