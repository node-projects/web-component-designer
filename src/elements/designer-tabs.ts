import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { IronSelectableBehavior } from '@polymer/iron-selector/iron-selectable.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';

export class DesignerTabs extends mixinBehaviors([IronSelectableBehavior], PolymerElement) {

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