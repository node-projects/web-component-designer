import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { BaseCustomWebComponentLazyAppend, BaseCustomWebComponentConstructorAppend } from "@node-projects/base-custom-webcomponent"

export class BaseCustomWebComponentPropertiesService implements IPropertiesService {
    
    public name = "baseCustomWebComponent";

    isHandledElement(designItem: IDesignItem): boolean {
        return designItem.element instanceof BaseCustomWebComponentLazyAppend || designItem.element instanceof BaseCustomWebComponentConstructorAppend;
    }

    getProperties(designItem: IDesignItem): IProperty[] { //todo support typescript enums
        if (!this.isHandledElement(designItem))
            return null;

        let properties: IProperty[] = [];
        let list = (<any>designItem.element.constructor).properties;
        for (const name in list) {
            const property = list[name];
            if (property === Date) {
              let property: IProperty = { name: name, type: "date", service: this };
              properties.push(property);
            } else if (property === Object) {
                let property: IProperty = { name: name, type: "object", service: this };
                properties.push(property);
            } else if (property === Number) {
                let property: IProperty = { name: name, type: "number", service: this };
                properties.push(property);
            } else {
                let property: IProperty = { name: name, type: "string", service: this };
                properties.push(property);
            }
        }
        return properties;
    }

    setValue(designItems: IDesignItem[], property: IProperty, value: any) {
      for (let d of designItems) {
        if (property.type === 'object')
        d.setAttribute(property.name, JSON.stringify(value));
        //@ts-ignore
        (<BaseCustomWebComponent>d.element)._parseAttributesToProperties();
      }
    }
  
    isSet(designItems: IDesignItem[], property: IProperty): ValueType {
      return ValueType.none;
    }
  
    getValue(designItems: IDesignItem[], property: IProperty) {
      return null;
    }
  
    getUnsetValue(designItems: IDesignItem[], property: IProperty) {
      return null;
    }

    /*private _camelToDashCase(text: string){
        return text.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
    }*/
}