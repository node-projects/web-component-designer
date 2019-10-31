import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';

export class LitElementPropertiesService implements IPropertiesService {

    public name = "lit"

    isHandledElement(element: Element): boolean {
        let proto = (<any>element.constructor).__proto__;
        while (proto != null) {
            if (proto.name == 'LitElement')
                return true;
            if (proto.name == undefined || proto.name == 'HTMLElement' || proto.name == 'Element' || proto.name == 'Node' || proto.name == 'HTMLElement')
                return false;
            proto = proto.__proto__;
        }
        return false;
    }

    getProperties(element: Element): IProperty[] {
        if (!this.isHandledElement(element))
            return null;
            
        let list = (<any>element.constructor)._classProperties as Map<string, object>;
        // @ts-ignore
        for (const litProperty of list) {
        }
        return null;
    }

}