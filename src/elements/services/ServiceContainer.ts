import { IUndoService } from './undoService/IUndoService';
import { IPropertiesService } from "./propertiesService/IPropertiesService";
import { IContainerService } from './containerService/IContainerService';
import { IElementsService } from './elementsService/IElementsService';
import { IService } from './IService';
import { IInstanceService } from './instanceService/IInstanceService';

interface ServiceNameMap {
    "actionHistory": IUndoService;
    "porpertyService": IPropertiesService;
    "containerService": IContainerService;
    "elementsService": IElementsService;
    "instanceService": IInstanceService
}

export class ServiceContainer {
    private _services: Map<string, IService[]> = new Map();

    private getLastService<K extends keyof ServiceNameMap>(service: K): ServiceNameMap[K] {
        let list: [] = <any>this._services.get(<string>service);
        return list[list.length - 1];
    }

    private getServices<K extends keyof ServiceNameMap>(service: K): ServiceNameMap[K][] {
        return <any>this._services.get(<string>service);
    }

    register<K extends keyof ServiceNameMap>(name: K, service: ServiceNameMap[K]) {
        if (!this._services.has(name))
            this._services.set(name, []);
        this._services.get(<string>name).push(service);
    }

    get actionHistory(): IUndoService {
        return this.getLastService('actionHistory');
    }

    get porpertiesServices(): IPropertiesService[] {
        return this.getServices('porpertyService');
    }

    get containerServices(): IContainerService[] {
        return this.getServices('containerService');
    }

    get elementsServices(): IElementsService[] {
        return this.getServices('elementsService');
    }

    get instanceServices(): IInstanceService[] {
        return this.getServices('instanceService');
    }

    forSomeServicesTillResult<K extends keyof ServiceNameMap>(service: K, callback: (service: ServiceNameMap[K]) => any): any {
        let services = this.getServices<K>(<any>service);
        for (let index = services.length - 1; index >= 0; index--) {
            const currentService = services[index];
            let result = callback(currentService);
            if (result != null)
                return result;
        }
        return null;
    }
}