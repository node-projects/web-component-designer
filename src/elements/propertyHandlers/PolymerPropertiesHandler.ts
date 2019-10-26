import { IPropertyHandler } from './IPropertyHandler';
import { IProperty } from './IProperty';

export class PolymerPropertiesHandler implements IPropertyHandler {

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