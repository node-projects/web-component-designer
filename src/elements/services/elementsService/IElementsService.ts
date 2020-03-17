import { IService } from "../IService";
import { IElementDefinition } from './IElementDefinition';

export interface IElementsService extends IService {
    readonly name: string
    getElements(): Promise<IElementDefinition[]>
}