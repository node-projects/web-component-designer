import { InstanceServiceContainer } from '../../services/InstanceServiceContainer';
import { ServiceContainer } from '../../services/ServiceContainer';

export interface IDemoView {
  display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string);
}