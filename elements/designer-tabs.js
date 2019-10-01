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
import { IronSelectableBehavior } from '@polymer/iron-selector/iron-selectable.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';

class DesignerTabs extends mixinBehaviors([IronSelectableBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          background-color: var(--dark-grey);
          text-transform: uppercase;
          width: 100%;
        }
        #container {
          position: relative;
          width: 100%;
        }
      </style>
      <div id="container">
        <slot></slot>
      </div>
    `;
  }

  static get is() { return 'designer-tabs'; }
}
customElements.define(DesignerTabs.is, DesignerTabs);
