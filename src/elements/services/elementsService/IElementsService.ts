import { IService } from "../IService";
import { IElementDefintion } from './IElementDefinition';

export interface IElementsService extends IService {
    readonly name: string
    getElements(): Promise<IElementDefintion[]>
}