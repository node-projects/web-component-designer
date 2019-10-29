import { IUndoService } from './undoService/IUndoService';
import { IPropertiesService } from "./propertiesService/IPropertiesService";
import { IContainerService } from './containerService/IContainerService';
import { IElementsService } from './elementsService/IElementsService';

interface ServiceNameMap {
    "actionHistory": IUndoService;
    "porpertyService": IPropertiesService;
    "containerService": IContainerService;
    "elementsService": IElementsService;
}

export class ServiceContainer {
    private _services: Map<string, object[]> = new Map();

    private getLastService<K extends keyof ServiceNameMap>(name: K): ServiceNameMap[K] {
        let list: [] = <any>this._services.get(<string>name);
        return list[list.length - 1];
    }

    private getServices<K extends keyof ServiceNameMap>(name: K): ServiceNameMap[K][] {
        return <any>this._services.get(<string>name);
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
}