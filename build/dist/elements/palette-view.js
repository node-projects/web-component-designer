import './controls/DesignerTabControl.js';
import { PaletteElements } from "./palette-elements.js";
import { DesignerTabControl } from "./controls/DesignerTabControl.js";
import { BaseCustomWebComponent, css } from "./controls/BaseCustomWebComponent.js";
export class PaletteView extends BaseCustomWebComponent {
  constructor() {
    super();
    this.selected = 'native';
    this._designerTabControl = new DesignerTabControl();
    this._designerTabControl.selectedIndex = 0;
    this.shadowRoot.appendChild(this._designerTabControl);
  }

  static get style() {
    return css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
    }`;
  }

  async loadControls(elementsServices) {
    for (const s of elementsServices) {
      let elements = await s.getElements();
      let paletteElement = new PaletteElements();
      paletteElement.title = s.name;

      this._designerTabControl.appendChild(paletteElement);

      paletteElement.loadElements(elements);
    }
  }

}
customElements.define('node-projects-palette-view', PaletteView);