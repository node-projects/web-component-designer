import { DesignerView } from "./designerView";

export class DefaultConfiguredDesignerView extends DesignerView {
  constructor(){
    super();
  }

  async ready() {
    const serviceContainer = await (await import('../../services/DefaultServiceBootstrap.js')).default;
    this.initialize(serviceContainer);
  }
}

customElements.define('node-projects-default-configured-designer-view', DefaultConfiguredDesignerView);