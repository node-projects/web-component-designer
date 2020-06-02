import { IService } from '../IService';
import { IElementDefinition } from '../elementsService/IElementDefinition';
import type { ServiceContainer } from '../ServiceContainer';
import type { InstanceServiceContainer } from '../InstanceServiceContainer';
import { IDesignItem } from '../../item/IDesignItem';

export interface IInstanceService extends IService {
    getElement(definition: IElementDefinition, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) : Promise<IDesignItem>
}