import { IPropertiesService } from './IPropertiesService';
import { IProperty } from './IProperty';

import cssProperties from './cssProperties.json'

export class CssPropertiesService implements IPropertiesService {

    isHandledElement(element: Element): boolean {
        return true;
    }

    getProperties(element: Element): IProperty[] {
        let properties: IProperty[] = [];
        for (const p in cssProperties.flex) {
            properties.push({ name: p });
        }
        return properties;
    }
}