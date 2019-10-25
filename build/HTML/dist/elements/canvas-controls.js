var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { PolymerElement } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { html } from "../../node_modules/@polymer/polymer/lib/utils/html-tag.js";
import { customElement, property } from "../../node_modules/@polymer/decorators/lib/decorators.js";
import "../../node_modules/@polymer/iron-icon/iron-icon.js";
import './app-icons.js';
import './designer-tab.js';
import { ActionHistoryType } from "../enums/ActionHistoryType.js";
let CanvasControls = class CanvasControls extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        designer-tab {
          color: white;
          background: var(--dark-grey);
          width: 100%;
          height: 41px;
          margin: 0;
          padding: 0;
          border: none;
          display: flex;
          padding: 0 0 1em;
          font-size: 10px;
          line-height: 1em;
          justify-content: space-around;
        }
        button {
          padding: 0;
          cursor: pointer;
          font-size: 8px;
          border: 2px solid transparent;
          border-width: 2px 0;
          position: relative;
          margin: 0;
          transition: all .05s ease-in;
          outline: none;
        }
        button[disabled] {
          pointer-events: none;
          opacity: 0.3;
        }
        button::before,
        button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          border: 2px solid transparent;
          border-width: 0 2px 0;
          box-sizing: border-box;
        }
        button::after {
          top: auto;
          bottom: 0;
        }
        button:hover,
        button:hover::before,
        button:hover::after,
        button:focus, /* :focus hack */
        button:focus::before,
        button:focus::after {
          border-color: var(--light-grey);
        }
        button:active,
        button:active::before,
        button:active::after {
          border-color: var(--highlight-pink);
        }
      </style>
      <designer-tab>
        <button on-click="delete" title="Delete element">
          <iron-icon icon="designer:delete"></iron-icon>
        </button>
        <button on-click="clone" id="cloneBtn" title="Clone element">
          <iron-icon icon="designer:copy"></iron-icon>
        </button>
        <button on-click="fit" id="fitBtn" title="Fit to parent">
          <iron-icon icon="designer:fit"></iron-icon>
        </button>
        <button on-click="moveUp" title="Move to parent. Also Shift+UpArrow" id="moveUpBtn">
          <iron-icon icon="designer:up"></iron-icon>
        </button>
        <button on-click="moveDown" title="Move to first child. Also Shift+DownArrow" id="moveDownBtn">
          <iron-icon icon="designer:down"></iron-icon>
        </button>
        <button on-click="moveBack" title="Move back. Also Shift+LeftArrow" id="moveBackBtn">
          <iron-icon icon="designer:back"></iron-icon>
        </button>
        <button on-click="moveForward" title="Move forward. Also Shift+RightArrow" id="moveForwardBtn">
          <iron-icon icon="designer:forward"></iron-icon>
        </button>
      </designer-tab>
    `;
  }
  /**
   * Disable a bunch of UI if the selected element is the canvas element.
   */


  update(disableUI) {
    this.$.cloneBtn.disabled = disableUI;
    this.$.fitBtn.disabled = disableUI;
    this.$.moveUpBtn.disabled = disableUI;
    this.$.moveDownBtn.disabled = disableUI;
    this.$.moveBackBtn.disabled = disableUI;
    this.$.moveForwardBtn.disabled = disableUI;
  }
  /**
   * Deletes the active element.
   */


  delete() {
    if (!this.selectedElement) {
      console.log('🔥 how did i get here?');
      return;
    }

    const el = this.selectedElement; // Deleting the top level app should remove its children.

    if (this._isCanvasElement(el)) {
      this.actionHistory.add(ActionHistoryType.Delete, el, {
        innerHTML: el.innerHTML
      });
      el.innerHTML = '';
    } else {
      const parent = el.parentElement;
      parent.removeChild(el);
      this.selectedElement = parent;
      this.actionHistory.add(ActionHistoryType.Delete, el, {
        parent: parent
      });
    }

    this._refreshView();
  }
  /**
   * Creates a sibling copy of the active element.
   */


  clone() {
    const el = this.selectedElement;

    if (this._isCanvasElement(el)) {
      return;
    }

    let clone = el.cloneNode(true);
    el.parentNode.appendChild(clone);
    this.dispatchEvent(new CustomEvent('selected-element-changed', {
      bubbles: true,
      composed: true,
      detail: {
        target: clone,
        node: this
      }
    })); // P.S: Since we did a clone, we already have the initial state of the <tag>.

    this.actionHistory.add(ActionHistoryType.New, clone, {
      parent: el.parentNode
    });

    this._refreshView();
  }
  /**
   * Fit an element to its target
   */


  fit() {
    const el = this.selectedElement;

    if (this._isCanvasElement(el)) {
      return;
    }

    this.actionHistory.add(ActionHistoryType.Fit, el, {
      new: {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%'
      },
      old: {
        position: el.style.position,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height
      }
    });
    el.style.position = 'absolute';
    el.style.left = el.style.top = '0px';
    el.style.height = el.style.width = '100%';
  }
  /**
   * Moving elements in the DOM
   */


  move(type, skipHistory) {
    switch (type) {
      case 'forward':
        this.moveForward(skipHistory);
        break;

      case 'back':
        this.moveBack(skipHistory);
        break;

      case 'up':
        this.moveUp(skipHistory);
        break;

      case 'down':
        this.moveDown(skipHistory);
        break;
    }
  }

  moveBack(skipHistory) {
    const el = this.selectedElement;

    if (this._isCanvasElement(el)) {
      return;
    }

    let parent = el.parentElement;
    let previous = el.previousElementSibling;

    if (previous) {
      parent.insertBefore(el, previous);
    } else {
      parent.appendChild(el);
    }

    this._refreshView();

    if (skipHistory === true) {
      return;
    }

    this.actionHistory.add(ActionHistoryType.MoveBack, el);
  }

  moveForward(skipHistory) {
    const el = this.selectedElement;

    if (this._isCanvasElement(el)) {
      return;
    }

    let parent = el.parentElement; // Since you can't insertAfter your next sibling, you need to
    // insert before two siblings over.

    let next = el.nextElementSibling;

    if (next) {
      next = next.nextElementSibling;

      if (next) {
        parent.insertBefore(el, next);
      } else {
        parent.appendChild(el);
      }
    } else {
      parent.insertBefore(el, parent.firstChild);
    }

    this._refreshView();

    if (skipHistory === true) {
      return;
    }

    this.actionHistory.add(ActionHistoryType.MoveForward, el);
  }

  moveUp(skipHistory) {
    const el = this.selectedElement;
    let parent = el.parentElement; // If the parent isn't already the viewContainer, move it one up.

    if (this._isCanvasElement(el) || parent && parent.id === 'canvas') {
      return;
    }

    parent.removeChild(el);
    parent.parentElement.appendChild(el);

    this._refreshView();

    if (skipHistory === true) {
      return;
    }

    this.actionHistory.add(ActionHistoryType.MoveUp, el, {
      old: {
        parent: parent
      },
      new: {
        parent: parent.parentElement
      }
    });
  }

  moveDown(skipHistory) {
    const el = this.selectedElement;
    let sibling = el.nextElementSibling;

    if (this._isCanvasElement(el) || !sibling) {
      return;
    } // Not everything accepts children, as we've learnt from canvas-view
    // (where I copied this code from like a lazy bum)


    let slots = sibling ? sibling.querySelectorAll('slot') : [];
    let canDrop = sibling.localName.indexOf('-') === -1 && sibling.localName !== 'input' || sibling.localName === 'dom-repeat' || slots.length !== 0;

    if (!canDrop) {
      return;
    } // If you can, add it there.


    const oldParent = el.parentElement;
    sibling.appendChild(el);
    const oldPosition = el.style.position;
    el.style.position = 'relative';

    this._refreshView();

    if (skipHistory === true) {
      return;
    }

    this.actionHistory.add(ActionHistoryType.MoveDown, el, {
      old: {
        parent: oldParent,
        position: oldPosition
      },
      new: {
        parent: sibling,
        position: 'relative'
      }
    });
  }

  _refreshView() {
    this.dispatchEvent(new CustomEvent('refresh-view', {
      bubbles: true,
      composed: true,
      detail: {
        node: this
      }
    }));
  }

  _selectedElementChanged() {
    this.dispatchEvent(new CustomEvent('selected-element-changed', {
      bubbles: true,
      composed: true,
      detail: {
        target: this.selectedElement,
        node: this
      }
    }));
  }

  _isCanvasElement(el) {
    return el === this.canvasElement;
  }

};

__decorate([property({
  type: Object,
  observer: '_selectedElementChanged'
})], CanvasControls.prototype, "selectedElement", void 0);

__decorate([property({
  type: Object
})], CanvasControls.prototype, "canvasElement", void 0);

__decorate([property({
  type: Object
})], CanvasControls.prototype, "actionHistory", void 0);

CanvasControls = __decorate([customElement('canvas-controls')], CanvasControls);
export { CanvasControls }; //# sourceMappingURL=canvas-controls.js.map