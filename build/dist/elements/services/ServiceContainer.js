import { BaseServiceContainer } from "./BaseServiceContainer.js";
export class ServiceContainer extends BaseServiceContainer {
  get porpertiesServices() {
    return this.getServices('propertyService');
  }

  get containerServices() {
    return this.getServices('containerService');
  }

  get elementsServices() {
    return this.getServices('elementsService');
  }

  get instanceServices() {
    return this.getServices('instanceService');
  }

  get editorTypesServices() {
    return this.getServices('editorTypesService');
  }

}