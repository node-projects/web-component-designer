import { ServiceContainer } from '../services/ServiceContainer';
import { IDesignItem } from './IDesignItem';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';

export class DesignItem implements IDesignItem {
    element: HTMLElement;
    serviceContainer: ServiceContainer;
    instanceServiceContainer: InstanceServiceContainer;

    private static _designItemSymbol = Symbol('DesignItem');

    constructor(element: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
        this.element = element;
        this.serviceContainer = serviceContainer;
        this.instanceServiceContainer = instanceServiceContainer;
    }

    static GetOrCreateDesignItem(element: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
        if (!element)
            return null;
        let designItem: IDesignItem = element[DesignItem._designItemSymbol];
        if (!designItem) {
            designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
        }
        return designItem;
    }
}