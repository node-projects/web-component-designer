import { IProperty } from './IProperty';
export interface IPropertiesService {
    isHandledElement(element: Element): boolean;
    getProperties(element: Element): IProperty[];
}
