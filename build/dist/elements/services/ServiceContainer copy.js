export class ServiceContainer {
  constructor() {
    this._services = new Map();
  }

  getLastService(service) {
    let list = this._services.get(service);

    return list[list.length - 1];
  }

  getServices(service) {
    return this._services.get(service);
  }

  register(name, service) {
    if (!this._services.has(name)) this._services.set(name, []);

    this._services.get(name).push(service);
  }

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

  forSomeServicesTillResult(service, callback) {
    let services = this.getServices(service);

    for (let index = services.length - 1; index >= 0; index--) {
      const currentService = services[index];
      let result = callback(currentService);
      if (result != null) return result;
    }

    return null;
  }

}