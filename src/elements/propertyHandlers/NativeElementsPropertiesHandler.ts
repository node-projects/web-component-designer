import { IPropertyHandler } from './IPropertyHandler';
import { IProperty } from './IProperty';

export class NativeElementsPropertiesHandler implements IPropertyHandler {
    
    isHandledElement(element: Element): boolean {
        throw new Error("Method not implemented.");
    }    
    
    getProperties(element: Element): IProperty[] {
        throw new Error("Method not implemented.");
    }
}
