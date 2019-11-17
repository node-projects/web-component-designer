/*import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement, property } from '@polymer/decorators';
import { UndoService } from '../elements/services/undoService/UndoService.js';

import '@polymer/iron-icon/iron-icon.js';
import './app-icons.js';
import { AppShell } from './app-shell';

@customElement('app-controls')
export class AppControls extends PolymerElement {
  @property({type: Array})
  actionHistory : UndoService;

  @property({type: Object})
  appShell : AppShell;

  static get template() {
    return html`
      <style>
        :host {
          display: flex;
        }
        button {
          background-color: transparent;
          color: white;
          border: none;
          cursor: pointer;
          transition: all .05s ease-in;
        }
        button[disabled] {
          opacity: 0.3;
          pointer-events: none;
        }
        button:hover {
          transform: scale(1.1);
        }
        .separator {
          border-left: var(--light-grey) solid 1px;
          opacity: .8;
          height: 24px;
          margin: 8px;
        }
      </style>
      <button on-click="undo" id="undoBtn" disabled="" title="Undo">
        <iron-icon icon="designer:undo"></iron-icon>
        <div>Undo</div>
      </button>
      <button on-click="redo" id="redoBtn" disabled="" title="Redo">
        <iron-icon icon="designer:redo"></iron-icon>
        <div>Redo</div>
      </button>
    `;
  }

  update(undos, redos) {
    (this.$.undoBtn as HTMLInputElement).disabled = (undos === 0);
    (this.$.redoBtn as HTMLInputElement).disabled = (redos === 0);
  }

  new() {
    this.appShell.new();
  }

  undo() {
    this.actionHistory.undo();
  }

  redo() {
    this.actionHistory.redo();
  }
}
*/