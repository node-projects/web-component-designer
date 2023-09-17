import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';

export interface IDemoView extends IUiCommandHandler, IDisposable, HTMLElement {
  display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string);
}