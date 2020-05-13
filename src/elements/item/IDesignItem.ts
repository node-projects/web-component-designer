import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';

export interface IDesignItem {
    element: Element;
    serviceContainer: ServiceContainer;
    instanceServiceContainer: InstanceServiceContainer;
}