import '../../controls/DesignerTabControl.js';
import { IElementsService } from '../../services/elementsService/IElementsService';
import { PaletteElements } from './paletteElements';
import { DesignerTabControl } from '../../controls/DesignerTabControl';
import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from '../../services/ServiceContainer';

export class PaletteView extends BaseCustomWebComponentLazyAppend {

  public selected = 'native';

  private _designerTabControl: DesignerTabControl;

  static override readonly style = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
    }`;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    
    this._designerTabControl = new DesignerTabControl();
    this._designerTabControl.selectedIndex = 0;
    this.shadowRoot.appendChild(this._designerTabControl);
  }

  public async loadControls(serviceContainer: ServiceContainer, elementsServices: IElementsService[]) {
    for (const s of elementsServices) {
      try {
        let elements = await s.getElements();
        let paletteElement = new PaletteElements();
        paletteElement.title = s.name;
        this._designerTabControl.appendChild(paletteElement);
        paletteElement.loadElements(serviceContainer, elements);
      } catch (err) {
        console.warn('Error loading elements', err);
      }
    }
    this._designerTabControl.refreshItems();
  }
}

customElements.define('node-projects-palette-view', PaletteView);