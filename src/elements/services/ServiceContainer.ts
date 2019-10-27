import { ActionHistory } from '../ActionHistory';
import { IPropertiesService } from "./propertiesService/IPropertiesService";
import { IContainerService } from './containerService/IContainerService';
import { IElementsService } from './elementsService/IElementsService';

interface ServiceNameMap {
    "actionHistory": ActionHistory;
    "porpertyService": IPropertiesService;
    "containerService": IContainerService;
    "elementsService": IElementsService;
}

export class ServiceContainer {
    private _services: Map<string, object[]>

    private getLastService<K extends keyof ServiceNameMap>(name: K): ServiceNameMap[K] {
        let list: [] = this._services[<string>name];
        return <any>list[list.length - 1];
    }

    private getServices<K extends keyof ServiceNameMap>(name: K): ServiceNameMap[K][] {
        return this._services[<string>name];
    }

    register<K extends keyof ServiceNameMap>(name: K, service: ServiceNameMap[K]) {
        if (!this._services.has(name))
            this._services.set(name, []);
        this._services[<string>name].push(service);
    }

    get actionHistory(): ActionHistory {
        return this.getLastService('actionHistory');
    }

    get porpertiesServices(): IPropertiesService[] {
        return this.getServices('porpertyService');
    }

    get containerServices(): IContainerService[] {
        return this.getServices('containerService');
    }

    get elementsService(): IElementsService[] {
        return this.getServices('elementsService');
    }
}