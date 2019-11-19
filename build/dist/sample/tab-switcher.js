var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { html, PolymerElement } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { customElement, property } from "../../node_modules/@polymer/decorators/lib/decorators.js";
let SampleTabSwitcher = class SampleTabSwitcher extends PolymerElement {
  constructor() {
    super(...arguments);
    this.mainPage = 'designer';
  }

  static get template() {
    return html`
            <designer-tabs attr-for-selected="name" selected="{{mainPage}}">
              <designer-tab name="designer">
                <button>Designer</button>
              </designer-tab>
              <designer-tab name="preview">
                <button on-click="_viewDemo">Preview</button>
              </designer-tab>
              <designer-tab name="code">
                <button on-click="_viewCode">Code</button>
              </designer-tab>
            </designer-tabs>
            <iron-pages selected="[[mainPage]]" attr-for-selected="name" selected-attribute="visible">
              <canvas-view name="designer" id="viewContainer" style="height:100%"></canvas-view>
              <div name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
              <demo-view id="demoView" name="preview"></demo-view>
              <help-view name="help"></help-view>
            </iron-pages>
        `;
  }

  _viewDemo() {
    //@ts-ignore
    if (!window.codeView.get) return; //@ts-ignore

    this.$.demoView.display(window.codeView.get());
  }

  _viewCode() {
    this.dispatchEvent(new CustomEvent('update-code', {
      bubbles: true,
      composed: true,
      detail: {
        target: this.$.viewContainer,
        node: this
      }
    }));
  }

};

__decorate([property({
  type: String
})], SampleTabSwitcher.prototype, "mainPage", void 0);

SampleTabSwitcher = __decorate([customElement('sample-tab-switcher')], SampleTabSwitcher);
export { SampleTabSwitcher };