import { IService } from '../IService';
import { IElementDefinition } from '../elementsService/IElementDefinition';

export interface IInstanceService extends IService {
    getElement(definition: IElementDefinition) : Promise<HTMLElement>
}