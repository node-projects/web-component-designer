import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';

export class PolymerPropertiesService implements IPropertiesService {

    isHandledElement(element: Element): boolean {
        return (<any>element.constructor).polymerElementVersion != null;
    }

    getProperties(element: Element): IProperty[] {
        let list = (<any>element.constructor).properties;
        for (const name in list) {
            const polymerProperty = list[name];
            //polymerProperty.type
        }
        return null;
    }

}