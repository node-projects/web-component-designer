import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';

export class PolymerPropertiesService implements IPropertiesService {

    public name = "polymer"

    isHandledElement(element: Element): boolean {
        return (<any>element.constructor).polymerElementVersion != null;
    }

    getProperties(element: Element): IProperty[] { //todo support typescript enums
        if (!this.isHandledElement(element))
            return null;

        let properties: IProperty[] = [];
        let list = (<any>element.constructor).properties;
        for (const name in list) {
            const polymerProperty = list[name];
            if (polymerProperty === String) {
                let property: IProperty = { name: name, type: "string" };
                properties.push(property);
            } else if (polymerProperty === Object) {
                let property: IProperty = { name: name, type: "string" };
                properties.push(property);
            } else if (polymerProperty === Number) {
                let property: IProperty = { name: name, type: "number" };
                properties.push(property);
            } else if (polymerProperty === Date) {
                let property: IProperty = { name: name, type: "date" };
                properties.push(property);
            } else {
                if (polymerProperty.type === String) {
                    let property: IProperty = { name: name, type: "string" };
                    properties.push(property);
                } else if (polymerProperty.type === Object) {
                    let property: IProperty = { name: name, type: "string" };
                    properties.push(property);
                } else if (polymerProperty.type === Number) {
                    let property: IProperty = { name: name, type: "number" };
                    properties.push(property);
                } else if (polymerProperty.type === Date) {
                    let property: IProperty = { name: name, type: "date" };
                    properties.push(property)
                }
                else {
                    let property: IProperty = { name: name, type: "string" };
                    properties.push(property);
                }
            }
        }
        return properties;
    }

}