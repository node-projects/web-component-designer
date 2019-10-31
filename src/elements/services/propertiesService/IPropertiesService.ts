import { IProperty } from './IProperty';
import { IService } from '../IService';

export interface IPropertiesService extends IService {
    readonly name: string;
    isHandledElement(element: Element): boolean;
    getProperties(element: Element): IProperty[];
}
