import { IPropertiesService } from './IPropertiesService';
import { IProperty } from './IProperty';

import cssProperties from './cssProperties.js'

export class CssPropertiesService implements IPropertiesService {

    name: "flex" | "styles" ;

    constructor(name: "flex" | "styles") {
        this.name = name;
    }

    isHandledElement(element: Element): boolean {
        return true;
    }

    getProperties(element: Element): IProperty[] {
        let properties: IProperty[] = [];
        for (const p in <any>cssProperties[this.name]) {
            let pr = (<any>cssProperties[this.name][p]);
            properties.push({ name: p, type: pr.type, values: pr.values  });
        }
        return properties;
    }
}