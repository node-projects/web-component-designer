var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import { PolymerElement } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { html } from "../../node_modules/@polymer/polymer/lib/utils/html-tag.js";
import { customElement } from "../../node_modules/@polymer/decorators/lib/decorators.js";
import { ElementStuffBase } from './element-stuff-base.js';
import "../../node_modules/@polymer/paper-swatch-picker/paper-swatch-picker.js";
import './element-stuff-base.js';
import './element-stuff-shared-styles.js';
let ElementStyles = class ElementStyles extends ElementStuffBase(PolymerElement) {
  static get template() {
    return html`
      <style include="element-stuff-shared-styles">
        button.add {
          display: inline-block;
          background: transparent;
          border: none;
          padding: 4px 10px;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 500;
          text-decoration: none;
          text-transform: uppercase;
          line-height: 1.5;
          color: white;
          background: var(--dark-grey);
          margin-top: 4px;
          cursor: pointer;
          outline: none;
          border-radius: 5px;
        }
        button.add:hover {
          background: var(--highlight-pink);
        }
        paper-swatch-picker {
          border: 1px solid var(--input-border-color);
          border-radius: 5px;
          margin: 2px 0;
          --paper-icon-button-ink-color: var(--input-border-color);
          --paper-icon-button: {
            padding: 0;
            height: 20px;
            width: 20px;
          };
        }
      </style>
      <div class="content-wrapper">
        <label for="color">color</label>
        <paper-swatch-picker id="color" class="custom-picker" name="color" horizontal-align="right"></paper-swatch-picker>
        <label for="bkground-color">bkground color</label>
        <paper-swatch-picker id="bkground-color" class="custom-picker" name="backgroundColor" horizontal-align="right"></paper-swatch-picker>
        <label for="box-sizing">box-sizing</label>
        <select name="box-sizing" id="box-sizing">
          <option>border-box</option>
          <option>content-box</option>
        </select>
        <label for="border">border</label><input name="border" id="border">
        <label for="box-shadow">box shadow</label><input name="boxShadow" id="box-shadow">
        <label for="opacity">opacity</label><input name="opacity" type="text" min="0" max="1" step="0.1" value="1" id="opacity">
        <label for="padding">padding</label><input name="padding" id="padding">
        <label for="margin">margin</label><input name="margin" id="margin">
        <label for="position">position</label>
        <select name="position" id="position">
          <option>static</option>
          <option>absolute</option>
          <option>relative</option>
        </select>
        <label for="top">top</label><input name="top" id="top">
        <label for="right">right</label><input name="right" id="right">
        <label for="bottom">bottom</label><input name="bottom" id="bottom">
        <label for="left">left</label><input name="left" id="left">
        <label for="width">width</label><input name="width" id="width">
        <label for="height">height</label><input name="height" id="height">
        <div id="bonus"></div>
        <button class="add" on-click="addStyle">+ Add style</button>
      </div>
    `;
  }

  constructor() {
    super();
    this.stuffType = 'style';
  }

  display(elementStyles, selectedElement) {
    for (let i = 0; i < this._stuff.length; i++) {
      let name = this._stuff[i];
      if (!elementStyles[name]) continue;
      let el = this.root.querySelector(`[name=${name}]`);

      if (name === 'backgroundColor' || name === 'color') {
        //@ts-ignore
        el.color = this._rgb2hex(elementStyles[name]);
      } else if (name === 'width' || name === 'height') {
        // For width or height, the computedStyle gives us exact pixels
        // rather than % positioning.
        el.value = selectedElement.style[name];
      } else {
        el.value = elementStyles[name];
      }
    }
  }

  addStyle(event) {
    let label = document.createElement('input');
    label.className = 'style-label';
    let input = document.createElement('input');
    input.className = 'style-value';
    this.$.bonus.appendChild(label);
    this.$.bonus.appendChild(input);
  }

  _rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return rgb && rgb.length === 4 ? "#" + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
  }

};
ElementStyles = __decorate([customElement('element-stuff-styles')], ElementStyles);
export { ElementStyles }; //# sourceMappingURL=element-stuff-styles.js.map