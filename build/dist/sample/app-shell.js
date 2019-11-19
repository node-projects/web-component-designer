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
import "../../node_modules/@polymer/app-layout/app-header/app-header.js";
import "../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js";
import "../../node_modules/@polymer/iron-pages/iron-pages.js";
import "../../node_modules/@polymer/iron-icon/iron-icon.js";
import "../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js"; //import './app-icons.js';

import './app-controls.js';
import '../elements/palette-view.js';
import '../elements/services/undoService/UndoService.js';
import '../elements/demo-view.js'; //import '../elements/help-view.js';

import '../elements/tree-view.js';
import '../elements/attribute-editor.js';
import '../elements/canvas-view.js';
import { DockSpawnTsWebcomponent } from "../../node_modules/dock-spawn-ts/lib/js/webcomponent/DockSpawnTsWebcomponent.js";
import { JsonElementsService } from "../elements/services/elementsService/JsonElementsService.js";
import serviceContainer from "../elements/services/DefaultServiceBootstrap.js";
import { SampleDocument } from './sample-document.js';
DockSpawnTsWebcomponent.cssRootDirectory = "./assets/css/"; //@ts-ignore

window.require(["ace/ace"], function (a) {
  if (a) {
    a.config.init(true); //@ts-ignore

    a.define = window.define;
  }

  if (!window.ace) window.ace = a;

  for (var key in a) if (a.hasOwnProperty(key)) window.ace[key] = a[key];
});

let AppShell = class AppShell extends PolymerElement {
  constructor() {
    super(...arguments);
    this.mainPage = 'designer';
    this._documentNumber = 0;
  }

  static get template() {
    return html`
      <style>
        :host {
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
          --highlight-green: #99ff33;
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

        .app-body {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          padding-top: 60px;
          height: 100%;
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

        dock-spawn-ts > div {
          height: 100%;
        }

        attribute-editor {
          height: 100%;
          width: 100%;
        }
      </style>

      <app-header fixed="">
        <app-toolbar>
          <span class="heavy">web-component-designer <span class="lite">// a design framework for web-components using web-components</span></span>
          <button on-click="newDocument" style="margin-left: 50px;">new</button>
        </app-toolbar>
      </app-header>

      <div class="app-body">
        <dock-spawn-ts id="dock" style="width: 100%; height: 100%; position: relative;">
          
          <div title="Tree" dock-spawn-dock-type="left" dock-spawn-dock-ratio="0.2">
            <!--<tree-view name="tree" id="treeView"></tree-view>-->
          </div>

          <div id="attributesDock" title="Properties" dock-spawn-dock-type="right" dock-spawn-dock-ratio="0.2">
            <attribute-editor id="attributesEditor"></attribute-editor>
            <!--<canvas-controls id="canvasControls"></canvas-controls>
            <element-view id="elementView"></element-view>-->
          </div>
          <div title="Elements" dock-spawn-dock-type="down" dock-spawn-dock-to="attributesDock" dock-spawn-dock-ratio="0.4">
            <palette-view id="paletteView"></palette-view>
          </div>
        </dock-spawn-ts>
      </div>
    `;
  }

  _createServiceContainer() {}

  ready() {
    super.ready();
    serviceContainer.register('elementsService', new JsonElementsService('native', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements-native.json'));
    serviceContainer.register('elementsService', new JsonElementsService('samples', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements-samples.json'));
    serviceContainer.register('elementsService', new JsonElementsService('custom', 'https://raw.githubusercontent.com/node-projects/web-component-designer/master/src/sample/elements.json'));
    this.$.paletteView.loadControls(serviceContainer.elementsServices);
    this.$.attributesEditor.serviceContainer = serviceContainer;
    this.newDocument();
    this.$.dock.dockManager.addLayoutListener({
      onActivePanelChange: (manager, panel) => {
        if (panel) {
          let element = panel.elementContent.assignedElements()[0];

          if (element.localName == "sample-document") {
            let sampleDocument = element;
            let selection = sampleDocument.instanceServiceContainer.selectionService.selectedElements;
            this.$.attributesEditor.selectedElements = selection;
          }
        }
      }
    }); //(<SampleDocument>this.$.doc1).serviceContainer = serviceContainer;
    // Explanation and apology: normally, codeView would be a child
    // of this element, and could be this.$.codeView, but ace.js
    // doesn't like being in the shadow dom, and this is why we
    // can't have nice things.
    //@ts-ignore
    //window.codeView.canvasElement = this.$.viewContainer;
    //this.setActiveElement(this.$.viewContainer);
    //this.refreshView();
    //(this.$.canvasControls as CanvasControls).actionHistory = this.$.actionHistory as ActionHistory;
    //(this.$.canvasControls as CanvasControls).canvasElement = this.$.viewContainer;
    //(this.$.appControls as AppControls).actionHistory = this.$.actionHistory as ActionHistory;
    //(this.$.viewContainer as CanvasView).actionHistory = this.$.actionHistory as ActionHistory;
    //this.addEventListener('new-element', event => this.createElement(event));
    //this.addEventListener('new-sample', event => this.createSample(event));
    //this.addEventListener('element-updated', event => this.updateElement(event));
    //this.addEventListener('refresh-view', (event: CustomEvent) => this.refreshView(event));
    //this.addEventListener('finish-clone', (event: CustomEvent) => {
    //  this._finishNewElement(event.detail.target, event.detail.target.localName, true);
    //});

    /*this.addEventListener('update-action-buttons', (event: CustomEvent) => {
      (this.$.appControls as AppControls).update(event.detail.undos, event.detail.redos);
    });
    this.addEventListener('package-names-ready', (event: CustomEvent) => {
      //@ts-ignore
      window.codeView.elementsToPackages = event.detail.list;
    });*/

    /*this.addEventListener('remove-from-canvas', (event: CustomEvent) => {
      const parent = event.detail.parent;
      const node = event.detail.target;
      if (parent === this.$.viewContainer) {
        (this.$.viewContainer as CanvasView).removes(node);
      } else {
        parent.removeChild(node);
      }
      parent.click();
    });
    this.addEventListener('add-to-canvas', (event: CustomEvent) => {
      const parent = event.detail.parent;
      const node = event.detail.target;
      if (parent === this.$.viewContainer) {
        (this.$.viewContainer as CanvasView).add(node);
      } else {
        parent.appendChild(node);
      }
      node.click();
    });
    this.addEventListener('move', (event: CustomEvent) => {
      (this.$.canvasControls as CanvasControls).move(event.detail.type, event.detail.skipHistory);
    });*/
  }

  newDocument() {
    this._documentNumber++;
    let sampleDocument = new SampleDocument(serviceContainer);
    sampleDocument.title = "document-" + this._documentNumber;
    this.$.dock.appendChild(sampleDocument); //sampleDocument.serviceContainer = serviceContainer;
    //sampleDocument.instanceServiceContainer
    //sampleDocument.addEventListener('selected-elements-changed', (e: CustomEvent) => this.setActiveElement(e.detail.elements));
  }
  /*
   * Updates the new active element in the view.
   */


  setActiveElement(elements) {} //(<AttributeEditor>this.$.attributesEditor).selectedElements = elements;

  /*if (el === this) {
    el = this.$.viewContainer;
  }*/

  /*if (this.activeElement) {
    this.activeElement.classList.remove('active');
  }
  el.classList.add('active');*/
  // Tell everyone who cares about this.
  //todo: (this.$.viewContainer as CanvasView).setSelectedElements([this.activeElement = el]);
  //(this.$.canvasControls as CanvasControls).selectedElement = this.activeElement;
  //(this.$.canvasControls as CanvasControls).update(this.activeElement === this.$.viewContainer);

  /*
   * Adds a new element to the view.
   */

  /*createElement(event) {
    //let url = `@polymer/${packageName}/${kind}.js`;
    let tag = event.detail.type.toLowerCase();
        let el = document.createElement(tag);
    (this.$.viewContainer as CanvasView).add(el);
        // If we haven't before, save this initial state of a <tag> element,
    // so that we can diff it to produce the actual state of the world
    //@ts-ignore
    (window.codeView as CodeView).save(tag, event.detail.package, el);
    //serviceContainer.actionHistory.add(UndoItemType.New, el, { parent: el.parentNode });
        this._finishNewElement(el, tag);
    // You need the item to render first.
    requestAnimationFrame(() => {
      el.click();
    });
  }*/

  /*
   * Adds a new sample code to the view.
   */

  /*createSample(event) {
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
  }*/

  /**
   * Refreshes all the properties/styles of the active element.
   */


  refreshView(event) {
    /*if (event && event.detail.whileTracking) {
      let size = this.activeElement.getBoundingClientRect();
      (this.$.elementView as ElementView).displayPosition(size.top, size.left);
      return;
    }
          let el = this.activeElement ? this.activeElement : this.$.viewContainer;
    // Display its properties in the side view.
    (this.$.elementView as ElementView).display(el);
    // Highlight it in the tree.
    (this.$.treeView as TreeView).recomputeTree(this.$.viewContainer, el);*/
  }

  updateElement(event) {
    let detail = event.detail; //let oldValue = this.updateActiveElementValues(detail.type, detail.name, detail.value, detail.isAttribute);

    if (detail.skipHistory) {
      return;
    }
    /*serviceContainer.actionHistory.add(UndoItemType.Update, this.activeElement,
      {
        type: detail.type, name: detail.name,
        new: { value: detail.value },
        old: { value: oldValue }
      });*/

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
          children[i].style.position = 'relative'; //@ts-ignore

          children[i].style.top = children[i].style.left = 'auto';
        }
      }

      previousValue = this.activeElement.style[name];
      this.activeElement.style[name] = value;
    } else {
      previousValue = this.activeElement[name]; // If this is a dom-repeat, don't set the items attribute, set a fake
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

    this.$.treeView.recomputeTree(this.$.viewContainer, this.activeElement);
    return previousValue;
  }

  viewCode() {
    this.dispatchEvent(new CustomEvent('update-code', {
      bubbles: true,
      composed: true,
      detail: {
        target: this.$.viewContainer,
        node: this
      }
    }));
  }

  viewDemo() {
    //@ts-ignore
    if (!window.codeView.get) return; //@ts-ignore

    this.$.demoView.display(window.codeView.get());
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
    } // If it's a new element that isn't a clone, it was chosen from the
    // palette, so position it somewhere slightly better.


    el.style.boxSizing = 'border-box';
    el.style.position = 'absolute';
    el.style.left = el.style.top = '20px'; // If it's a native element, or has a slot, put some text in that slot
    // to indicate that.
    //let slots = el.root ? el.root.querySelectorAll('slot') : [];

    /*if (((this.$.paletteView as NativeView).isNativeElement(tag) && tag !== 'input') ||
      slots.length != 0) {
      el.textContent = tag;
    }*/
  }

  _makeUniqueId(node, id, suffix = null) {
    id = id.replace('-', '_');
    let uId = id + (suffix || '');
    return this.$.viewContainer.has('#' + uId) ? this._makeUniqueId(node, id, suffix ? ++suffix : 1) : uId;
  }

};

__decorate([property({
  type: Object
})], AppShell.prototype, "activeElement", void 0);

__decorate([property({
  type: String
})], AppShell.prototype, "mainPage", void 0);

AppShell = __decorate([customElement('app-shell')], AppShell);
export { AppShell };