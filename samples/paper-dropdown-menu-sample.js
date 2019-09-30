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

import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';

class PaperDropdownMenuSample extends PolymerElement {
  static get template() {
    return html`
      <paper-dropdown-menu label="Dinosaurs">
        <paper-listbox slot="dropdown-content" selected="1">
          <paper-item>allosaurus</paper-item>
          <paper-item>brontosaurus</paper-item>
          <paper-item>carcharodontosaurus</paper-item>
          <paper-item>diplodocus</paper-item>
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }

  static get is() { return 'paper-dropdown-menu-sample'; }
}
customElements.define(PaperDropdownMenuSample.is, PaperDropdownMenuSample);
