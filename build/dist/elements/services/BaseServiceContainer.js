export class BaseServiceContainer {
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