import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IService } from './IService.js';


export class BaseServiceContainer<NameMap> {
  protected _services: Map<string, IService[]> = new Map();
  public servicesChanged = new TypedEvent<{ serviceName: keyof NameMap }>();

  getLastService<K extends keyof NameMap>(service: K): NameMap[K] {
    let list: [] = <any>this._services.get(<string>service);
    if (list && list.length)
      return list[list.length - 1];
    return null;
  }

  getServices<K extends keyof NameMap>(service: K): NameMap[K][] {
    return <any>this._services.get(<string>service);
  }

  register<K extends keyof NameMap>(name: K, service: NameMap[K]) {
    if (!this._services.has(<string>name))
      this._services.set(<string>name, []);
    this._services.get(<string>name).push(service);
    this.servicesChanged.emit({ serviceName: <keyof NameMap>name });
  }

  registerMultiple<K extends keyof NameMap>(names: K[], service: NameMap[K]) {
    for (const name of names) {
      if (!this._services.has(<string>name))
        this._services.set(<string>name, []);
      this._services.get(<string>name).push(service);
      this.servicesChanged.emit({ serviceName: <keyof NameMap>name });
    }
  }

  forSomeServicesTillResult<K extends keyof NameMap, Y>(service: K, callback: (service: NameMap[K]) => Y): Y {
    let services = this.getServices<K>(<any>service);
    if (services == null) {
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
      return null;
    }
    for (let index = services.length - 1; index >= 0; index--) {
      const currentService = services[index];
      let result = callback(currentService);
      if (result)
        return currentService;
    }
    return null;
  }
}