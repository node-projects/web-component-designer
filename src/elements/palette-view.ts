import './designer-tab-control.js';
import { IElementsService } from './services/elementsService/IElementsService';
import { PaletteElements } from './palette-elements';
import { DesignerTabControl } from './designer-tab-control';

export class PaletteView extends HTMLElement {

  public selected = 'native';

  private static _style: CSSStyleSheet;
  private _designerTabControl: DesignerTabControl;

  constructor() {
    super();
    if (!PaletteView._style) {
      PaletteView._style = new CSSStyleSheet();
      //@ts-ignore
      PaletteView._style.replaceSync(`
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
      }
      `);
    }

    const shadow = this.attachShadow({ mode: 'open' });
    //@ts-ignore
    shadow.adoptedStyleSheets = [PaletteView._style];

    this._designerTabControl = new DesignerTabControl();
    this._designerTabControl.selectedIndex = 0;
    shadow.appendChild(this._designerTabControl);
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

customElements.define('palette-view', PaletteView);