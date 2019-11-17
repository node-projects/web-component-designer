import { IPropertiesService } from "./IPropertiesService";
import { IProperty } from './IProperty';
import { IDesignItem } from '../../item/IDesignItem';

export class LitElementPropertiesService implements IPropertiesService {

    public name = "lit"

    isHandledElement(designItem: IDesignItem): boolean {
        let proto = (<any>designItem.element.constructor).__proto__;
        while (proto != null) {
            if (proto.name == 'LitElement')
                return true;
            if (proto.name == undefined || proto.name == 'HTMLElement' || proto.name == 'Element' || proto.name == 'Node' || proto.name == 'HTMLElement')
                return false;
            proto = proto.__proto__;
        }
        return false;
    }

    getProperties(designItem: IDesignItem): IProperty[] {
        if (!this.isHandledElement(designItem))
            return null;
            
        let list = (<any>designItem.element.constructor)._classProperties as Map<string, object>;
        // @ts-ignore
        for (const litProperty of list) {
        }
        return null;
    }

    setValue(designItem: IDesignItem, property: IProperty, value: any) {
    }

    getValue(designItem: IDesignItem, property: IProperty) {
       return null;
    }
}