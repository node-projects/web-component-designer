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
      iron-pages {
        flex: 1;
        overflow: hidden;
        padding-bottom: 20px;
        background: var(--medium-grey);
        color: white;
      }
      button:hover {
        box-shadow: inset 0 3px 0 var(--light-grey);
      }
      button:focus {
        box-shadow: inset 0 3px 0 var(--highlight-pink);
      }
      `);
    }

    const shadow = this.attachShadow({ mode: 'open' });
    //@ts-ignore
    shadow.adoptedStyleSheets = [PaletteView._style];

    this._designerTabControl = new DesignerTabControl();
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