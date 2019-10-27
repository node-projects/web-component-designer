import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';

export class NativeElementsPropertiesService implements IPropertiesService {

    isHandledElement(element: Element): boolean {
        throw new Error("Method not implemented.");
    }    
    
    getProperties(element: Element): IProperty[] {
        throw new Error("Method not implemented.");
    }
}
