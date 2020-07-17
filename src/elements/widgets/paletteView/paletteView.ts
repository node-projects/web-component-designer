import '../../controls/DesignerTabControl.js';
import { IElementsService } from '../../services/elementsService/IElementsService';
import { PaletteElements } from './paletteElements';
import { DesignerTabControl } from '../../controls/DesignerTabControl';
import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';

export class PaletteView extends BaseCustomWebComponentLazyAppend {

  public selected = 'native';

  private _designerTabControl: DesignerTabControl;

  static get style() {
    return css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
    }`;
  }

  constructor() {
    super();
    this._designerTabControl = new DesignerTabControl();
    this._designerTabControl.selectedIndex = 0;
    this.shadowRoot.appendChild(this._designerTabControl);
  }

  public async loadControls(elementsServices : IElementsService[]) {
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