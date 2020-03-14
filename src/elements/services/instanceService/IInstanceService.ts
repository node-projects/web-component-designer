import { IService } from '../IService';
import { IElementDefintion } from '../elementsService/IElementDefinition';

export interface IInstanceService extends IService {
    getElement(definition: IElementDefintion) : Promise<HTMLElement>
}