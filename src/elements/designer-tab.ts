import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

@customElement('designer-tab')
export class DesignerTab extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
          position: relative;
          color: white;
        }
        :host([disabled]) {
          opacity: 0.3;
          pointer-events: none;
        }

        :host ::slotted(*) {
          display: inline-block;
          background-color: transparent;
          border: none;
          padding: 11px 13px;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 500;
          text-decoration: none;
          text-transform: uppercase;
          line-height: 1.5;
          color: inherit;
          outline: none;
          cursor: pointer;
          transition: box-shadow .1s ease-in;
        }
        :host(.iron-selected) ::slotted(*) {
          pointer-events: none;
          background: var(--medium-grey);
          box-shadow: inset 0 3px 0 var(--highlight-pink);
        }
      </style>
      <slot></slot>
    `;
  }

}
