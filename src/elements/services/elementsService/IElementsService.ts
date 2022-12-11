import { IService } from '../IService.js';
import { IElementDefinition } from './IElementDefinition.js';

export interface IElementsService extends IService {
    readonly name: string
    getElements(): Promise<IElementDefinition[]>
}