import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';

export interface IDesignItem {
    element: HTMLElement;
    serviceContainer: ServiceContainer;
    instanceServiceContainer: InstanceServiceContainer;
}