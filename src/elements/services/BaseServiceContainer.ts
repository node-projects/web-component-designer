import { IService } from './IService';


export class BaseServiceContainer<NameMap> {
  protected _services: Map<string, IService[]> = new Map();

  getLastService<K extends keyof NameMap>(service: K): NameMap[K] {
    let list: [] = <any>this._services.get(<string>service);
    return list[list.length - 1];
  }

  getServices<K extends keyof NameMap>(service: K): NameMap[K][] {
    return <any>this._services.get(<string>service);
  }

  register<K extends keyof NameMap>(name: K, service: NameMap[K]) {
    if (!this._services.has(<string>name))
      this._services.set(<string>name, []);
    this._services.get(<string>name).push(service);
  }

  forSomeServicesTillResult<K extends keyof NameMap, Y>(service: K, callback: (service: NameMap[K]) => Y): Y {
    let services = this.getServices<K>(<any>service);
    if (services == null) {
      console.warn('no services of type: ' + service + ' found');
      return null;
    }
    for (let index = services.length - 1; index >= 0; index--) {
      const currentService = services[index];
      let result = callback(currentService);
      if (result != null)
        return result;
    }
    return null;
  }

  getLastServiceWhere<K extends keyof NameMap, Y>(service: K, callback: (service: NameMap[K]) => Y): NameMap[K] {
    let services = this.getServices<K>(<any>service);
    if (services == null) {
      console.warn('no services of type: ' + service + ' found');
      return null;
    }
    for (let index = services.length - 1; index >= 0; index--) {
      const currentService = services[index];
      let result = callback(currentService);
      if (result != null)
        return currentService;
    }
    return null;
  }
}