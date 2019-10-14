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

import '@polymer/iron-form/iron-form.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-button/paper-button.js';

class IronFormSample extends PolymerElement {
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

  static get is() { return 'iron-form-sample'; }
}
customElements.define(IronFormSample.is, IronFormSample);
