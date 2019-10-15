import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';

@customElement("paper-dropdown-menu-sample")
export class PaperDropdownMenuSample extends PolymerElement {
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
}
