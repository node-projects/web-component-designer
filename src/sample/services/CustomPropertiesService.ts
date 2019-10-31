import { IPropertiesService } from '../../elements/services/propertiesService/IPropertiesService';
import { IProperty } from '../../elements/services/propertiesService/IProperty';

export class CustomPropertiesService implements IPropertiesService {

    name: string = "custom";

    isHandledElement(element: Element): boolean {
        if (element.nodeName == "test-element")
            return true;
        return false;
    }

    getProperties(element: Element): IProperty[] {
        let properties: IProperty[] = [];
        properties.push({ name: "Test 1", type: "string" });            
        return properties;
    }
}