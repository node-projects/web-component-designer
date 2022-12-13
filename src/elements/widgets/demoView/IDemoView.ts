import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';

export interface IDemoView {
  display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string);
}