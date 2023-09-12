import { IService } from '../IService.js';
import { IElementDefinition } from '../elementsService/IElementDefinition.js';
import type { ServiceContainer } from '../ServiceContainer.js';
import type { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';

export interface IInstanceService extends IService {
    getElement(definition: IElementDefinition, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) : Promise<IDesignItem>
}