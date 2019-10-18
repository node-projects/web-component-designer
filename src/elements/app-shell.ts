import { PolymerElement } from '@polymer/polymer';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement, property } from '@polymer/decorators';
import { CanvasControls } from './canvas-controls.js';
import { ActionHistory } from './action-history.js';
import { AppControls } from './app-controls.js';
import { TreeView } from './tree-view.js';
import { CanvasView } from './canvas-view.js';
import { CodeView } from './code-view.js';
import { DemoView } from './demo-view.js';
import { NativeView } from './palette-native.js';
import { ElementView } from './element-view.js';
import { DockSpawnTsWebcomponent } from 'dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent';

import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import './app-icons.js';
import './app-controls.js';
import './designer-tabs.js';
import './designer-tab.js';
import './palette-view.js';
import './action-history.js';
import './demo-view.js';
import './help-view.js';
import './tree-view.js';
import './element-view.js';
import './canvas-view.js';
import './canvas-controls.js';

DockSpawnTsWebcomponent.cssRootDirectory = "assets/css/";

//@ts-ignore
window.require(["ace/ace"], function(a) {
    if (a) {
        a.config.init(true);
        //@ts-ignore
        a.define = window.define;
    }
    if (!window.ace)
        window.ace = a;
    for (var key in a) if (a.hasOwnProperty(key))
        window.ace[key] = a[key];
});

@customElement('app-shell')
export class AppShell extends PolymerElement {
  @property({ type: Object })
  activeElement: HTMLElement;
  @property({ type: String })
  mainPage = 'designer';

  static get template() {
    return html`
      <style>
        :host{
          display: block;
          box-sizing: border-box;
          position: relative;

          /* Default colour scheme */
          --canvas-background: white;
          --almost-black: #141720;
          --dark-grey: #232733;
          --medium-grey: #2f3545;
          --light-grey: #383f52;
          --highlight-pink: #e91e63;
          --highlight-blue: #2196f3;
          --input-border-color: #596c7a;
        }

        app-header {
          background-color: var(--almost-black);
          color: white;
          height: 60px;
          width: 100%;
          position: fixed;
          z-index: 100;
        }

        button {
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          box-shadow: inset 0 3px 0 var(--light-grey);
        }
        button:focus {
          box-shadow: inset 0 3px 0 var(--highlight-pink);
        }

        button[disabled] {
          pointer-events: none;
          opacity: 0.3;
        }

        app-toolbar {
          display: flex;
          justify-content: space-between;
        }

        designer-tab.single {
          color: white;
          background: var(--dark-grey);
          width: 100%;
          height: 41px;
          margin: 0;
          padding: 0;
          border: none;
        }
        designer-tab.single span {
          box-shadow: none;
        }

        .app-body {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          padding-top: 60px;
          height: 100vh;
        }

        .main-view {
          position: relative;
          height: 100%;
          width: 100%;
          overflow: auto;
          display: flex;
          flex-grow: 1;
          flex-direction: column;
        }

        iron-pages  {
          height: 100%;
          overflow: auto;
        }

        .heavy {
          font-weight: 900;
          letter-spacing: 2px;
        }
        .lite {
          font-weight: 100;
          opacity: 0.5;
          letter-spacing: normal;
        }
        canvas-view {
          overflow: auto;
        }
        paper-toggle-button {
          position: absolute;
          top: 0;
          right: 10px;
          padding: 8px 5px;
          line-height: 1em;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          --paper-toggle-button-checked-bar-color:  var(--highlight-pink);
          --paper-toggle-button-checked-button-color:  var(--highlight-pink);
          --paper-toggle-button-label-color: var(--canvas-background);
          --paper-toggle-button-unchecked-bar-color:  var(--canvas-background);
          --paper-toggle-button-unchecked-button-color:  var(--canvas-background);
        }
      </style>

      <action-history id="actionHistory"></action-history>

      <app-header fixed="">
        <app-toolbar>
          <span class="heavy">wizzywid <span class="lite">// what you see is what you deserve</span></span>
          <app-controls id="appControls"></app-controls>
        </app-toolbar>
      </app-header>

      <div class="app-body">
        <dock-spawn-ts style="width: 100%; height: 100%; position: relative;">
          
          <div title="Document1" class="main-view">
            <designer-tabs attr-for-selected="name" selected="{{mainPage}}">
              <designer-tab name="designer">
                <button>Designer</button>
              </designer-tab>
              <designer-tab name="preview">
                <button on-click="viewDemo">Preview</button>
              </designer-tab>
              <designer-tab name="code">
                <button on-click="viewCode">Code</button>
              </designer-tab>
              <designer-tab name="help">
                <button>Help</button>
              </designer-tab>
            </designer-tabs>
            <iron-pages selected="[[mainPage]]" attr-for-selected="name" selected-attribute="visible">
              <canvas-view name="designer" id="viewContainer" style="height:100%"></canvas-view>
              <div name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
              <demo-view id="demoView" name="preview"></demo-view>
              <help-view name="help"></help-view>
            </iron-pages>
          </div>

          <div title="Tree" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2">
            <tree-view name="tree" id="treeView"></tree-view>
          </div>

          <div title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <canvas-controls id="canvasControls"></canvas-controls>
            <element-view id="elementView"></element-view>
            <palette-view id="paletteView"></palette-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;
  }

  ready() {
    super.ready();

    // Explanation and apology: normally, codeView would be a child
    // of this element, and could be this.$.codeView, but ace.js
    // doesn't like being in the shadow dom, and this is why we
    // can't have nice things.

    //@ts-ignore
    window.codeView.canvasElement = this.$.viewContainer;

    this.setActiveElement(this.$.viewContainer);
    this.refreshView();

    (this.$.canvasControls as CanvasControls).actionHistory = this.$.actionHistory as ActionHistory;
    (this.$.canvasControls as CanvasControls).canvasElement = this.$.viewContainer;
    (this.$.appControls as AppControls).actionHistory = this.$.actionHistory as ActionHistory;
    (this.$.viewContainer as CanvasView).actionHistory = this.$.actionHistory as ActionHistory;

    this.addEventListener('new-element', event => this.createElement(event));
    this.addEventListener('new-sample', event => this.createSample(event));
    this.addEventListener('element-updated', event => this.updateElement(event));

    this.addEventListener('refresh-view', (event : CustomEvent) => this.refreshView(event));
    this.addEventListener('selected-element-changed', (event : CustomEvent) => {
      this.setActiveElement(event.detail.target);
    });
    this.addEventListener('finish-clone', (event : CustomEvent) => {
      this._finishNewElement(event.detail.target, event.detail.target.localName, true);
    });
    this.addEventListener('update-action-buttons', (event : CustomEvent) => {
      (this.$.appControls as AppControls).update(event.detail.undos, event.detail.redos);
    });
    this.addEventListener('package-names-ready', (event : CustomEvent) => {
      //@ts-ignore
      window.codeView.elementsToPackages = event.detail.list;
    });

    this.addEventListener('remove-from-canvas', (event : CustomEvent) => {
      const parent = event.detail.parent;
      const node = event.detail.target;
      if (parent === this.$.viewContainer) {
        (this.$.viewContainer as CanvasView).removes(node);
      } else {
        parent.removeChild(node);
      }
      parent.click();
    });
    this.addEventListener('add-to-canvas', (event : CustomEvent) => {
      const parent = event.detail.parent;
      const node = event.detail.target;
      if (parent === this.$.viewContainer) {
        (this.$.viewContainer as CanvasView).add(node);
      } else {
        parent.appendChild(node);
      }
      node.click();
    });
    this.addEventListener('move', (event : CustomEvent) => {
      (this.$.canvasControls as CanvasControls).move(event.detail.type, event.detail.skipHistory);
    });
  }

  /*
   * Updates the new active element in the view.
   */
  setActiveElement(el) {
    if (el === this) {
      el = this.$.viewContainer;
    }

    if (this.activeElement) {
      this.activeElement.classList.remove('active');
    }
    el.classList.add('active');

    // Tell everyone who cares about this.
    (this.$.canvasControls as CanvasControls).selectedElement = (this.$.viewContainer as CanvasView).selectedElement = this.activeElement = el;
    (this.$.canvasControls as CanvasControls).selectedElement = this.activeElement;
    (this.$.canvasControls as CanvasControls).update(this.activeElement === this.$.viewContainer);
  }

  /*
   * Adds a new element to the view.
   */
  createElement(event) {
    //let url = `@polymer/${packageName}/${kind}.js`;
    let tag = event.detail.type.toLowerCase();

    let el = document.createElement(tag);
    (this.$.viewContainer as CanvasView).add(el);

    // If we haven't before, save this initial state of a <tag> element,
    // so that we can diff it to produce the actual state of the world
    //@ts-ignore
    (window.codeView as CodeView).save(tag, event.detail.package, el);
    (this.$.actionHistory as ActionHistory).add('new', el, {parent: el.parentNode});

    this._finishNewElement(el, tag);
    // You need the item to render first.
    requestAnimationFrame(function() {
      el.click();
    });
  }

  /*
   * Adds a new sample code to the view.
   */
  createSample(event) {
    let tag = event.detail.type.toLowerCase();;

    let el = document.createElement(tag);
    (this.$.viewContainer as CanvasView).add(el);
    
    if (tag !== 'app-layout-sample') {
      el.style.boxSizing = 'border-box';
      el.style.position = 'absolute';
      el.style.left = el.style.top = '20px';
      el.click();
    }

    this.refreshView();
  }

  /**
   * Refreshes all the properties/styles of the active element.
   */
  refreshView(event? : CustomEvent) {
    if (event && event.detail.whileTracking) {
      let size = this.activeElement.getBoundingClientRect();
      (this.$.elementView as ElementView).displayPosition(size.top, size.left);
      return;
    }

    let el = this.activeElement ? this.activeElement : this.$.viewContainer;
    // Display its properties in the side view.
    (this.$.elementView as ElementView).display(el);
    // Highlight it in the tree.
    (this.$.treeView as TreeView).recomputeTree(this.$.viewContainer, el);
  }

  updateElement(event) {
    let detail = event.detail;
    let oldValue = this.updateActiveElementValues(detail.type, detail.name, detail.value, detail.isAttribute);

    if (detail.skipHistory) {
      return;
    }
    (this.$.actionHistory as ActionHistory).add('update', this.activeElement,
      {
        type: detail.type, name: detail.name,
        new: {value: detail.value},
        old: {value: oldValue}
      });
  }

  /**
   * Updates the active element's displayed values.
   */
  updateActiveElementValues(type, name, value, isAttribute) {
    let previousValue;

    if (type === 'style') {
      // If we switch to flexbox, automatically reposition the children
      if (name === 'display' && value === 'flex') {
        let children = this.activeElement.children;
        for (let i = 0; i < children.length; i++) {
          //@ts-ignore
          children[i].style.position = 'relative';
          //@ts-ignore
          children[i].style.top = children[i].style.left = 'auto';
        }
      }
      previousValue = this.activeElement.style[name];
      this.activeElement.style[name] = value;
    } else {
      previousValue = this.activeElement[name];

      // If this is a dom-repeat, don't set the items attribute, set a fake
      // items instead (so that it doesn't stamp).
      if (this.activeElement.localName === 'dom-repeat' && name === 'items') {
        this.activeElement.dataset['fakeItemsAttr'] = value;
      } else if (value === 'true') {
        this._setPropertyOrValue(name, true, isAttribute);
      } else if (value === 'false') {
        if (this.activeElement.hasAttribute(name)) {
          this.activeElement.removeAttribute(name);
        } else {
          this._setPropertyOrValue(name, false, isAttribute);
        }
      } else {
        this._setPropertyOrValue(name, value, isAttribute);
      }
    }

    (this.$.treeView as TreeView).recomputeTree(this.$.viewContainer, this.activeElement);
    return previousValue;
  }

  viewCode() {
    this.dispatchEvent(new CustomEvent('update-code', {bubbles: true, composed: true, detail: {target: this.$.viewContainer, node: this}}));
  }

  viewDemo() {
    //@ts-ignore
    if (!window.codeView.get)
      return;
      //@ts-ignore
    (this.$.demoView as DemoView).display(window.codeView.get());
  }

  _setPropertyOrValue(name, value, isAttribute) {
    if (isAttribute) {
      this.activeElement.setAttribute(name, value);
    } else {
      this.activeElement[name] = value;
    }
  }

  /**
   * Initializes a new element that has just been added to the canvas.
   */
  _finishNewElement(el, tag, isClone = false) {
    el.id = this._makeUniqueId(el, tag);

    if (isClone) {
      // Go through the children and reset their IDs too.
      for (let i = 0; i < el.length; i++) {
        el[i].id = this._makeUniqueId(el[i], el[i].localName);
      }
      return;
    }

    // If it's a new element that isn't a clone, it was chosen from the
    // palette, so position it somewhere slightly better.
    el.style.boxSizing = 'border-box';
    el.style.position = 'absolute';
    el.style.left = el.style.top = '20px';

    // If it's a native element, or has a slot, put some text in that slot
    // to indicate that.
    let slots = el.root ? el.root.querySelectorAll('slot') : [];

    if (((this.$.paletteView as NativeView).isNativeElement(tag) && tag !== 'input') ||
        slots.length != 0) {
      el.textContent = tag;
    }
  }

  _makeUniqueId(node, id, suffix = null) {
    id = id.replace('-', '_');
    let uId = id + (suffix || '');
    return (this.$.viewContainer as CanvasView).has('#' + uId) ?
      this._makeUniqueId(node, id, suffix ? ++suffix : 1) : uId;
  }
}
