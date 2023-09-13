import { DesignerView } from './designerView.js';

export class DefaultConfiguredDesignerView extends DesignerView {
  constructor(){
    super();
  }

  async ready() {
    const createDefaultServiceContainer = await (await import('../../services/DefaultServiceBootstrap.js')).default;
    this.initialize(createDefaultServiceContainer());
  }
}

customElements.define('node-projects-default-configured-designer-view', DefaultConfiguredDesignerView);