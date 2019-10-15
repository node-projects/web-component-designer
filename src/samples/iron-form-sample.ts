import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

import '@polymer/iron-form/iron-form.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-button/paper-button.js';

@customElement("iron-form-sample")
export class IronFormSample extends PolymerElement {
  static get template() {
    return html`
      <iron-form style="background:white;padding:20px;">
        <h2>A sample form</h2>
        <form method="get" action="https://httpbin.org/get">
          <paper-input name="name" label="Your name" value="Batman"></paper-input>
          <paper-input name="food" label="Favourite snack" value="Donuts"></paper-input>
          <paper-checkbox name="cheese" value="yes" checked>I like cheese</paper-checkbox>
        </form>
        <br>
        <paper-button style="width:100%;margin:0;background:#03a9f4;color: white;"
            raised onclick="this.parentElement.submit()">Submit</paper-button>
      </iron-form>
    `;
  }
}
