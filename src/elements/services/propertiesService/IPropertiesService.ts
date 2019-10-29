import { IProperty } from './IProperty';
import { IService } from '../IService';

export interface IPropertiesService extends IService {
    isHandledElement(element: Element): boolean;
    getProperties(element: Element): IProperty[];
}
