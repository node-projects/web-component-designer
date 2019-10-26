import { IProperty } from './IProperty';

export interface IPropertyHandler {
    isHandledElement(element: Element): boolean
    getProperties(element: Element): IProperty[]
}