import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { BaseCustomWebComponentLazyAppend, BaseCustomWebComponentConstructorAppend, property } from "@node-projects/base-custom-webcomponent"
import { PropertiesHelper } from './PropertiesHelper';

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
      const propertyObj = list[name];
      if (propertyObj === Date) {
        let property: IProperty = { name: name, type: "date", service: this };
        properties.push(property);
      } else if (propertyObj === Object) {
        let property: IProperty = { name: name, type: "object", service: this };
        properties.push(property);
      } else if (propertyObj === Number) {
        let property: IProperty = { name: name, type: "number", service: this };
        properties.push(property);
      } else if (PropertiesHelper.isTypescriptEnum(propertyObj)) {
        let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(propertyObj), service: this };
        properties.push(property);
      } else {
        let property: IProperty = { name: name, type: "string", service: this };
        properties.push(property);
      }
    }
    return properties;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    let attributeName = PropertiesHelper.camelToDashCase(property.name);
    for (let d of designItems) {
      if (property.type === 'object')
        d.setAttribute(attributeName, JSON.stringify(value));
      else
        d.setAttribute(attributeName, value);
      //@ts-ignore
      (<BaseCustomWebComponent>d.element)._parseAttributesToProperties();
    }
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      if (property.type === 'object')
        d.removeAttribute(property.name);
      //@ts-ignore
      (<BaseCustomWebComponent>d.element)._parseAttributesToProperties();
    }
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      let attributeName = PropertiesHelper.camelToDashCase(property.name);
      designItems.forEach((x) => {
        let has = x.attributes.has(attributeName);
        all = all && has;
        some = some || has;
      });
    }
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  getValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      let attributeName = PropertiesHelper.camelToDashCase(property.name);
      let lastValue = designItems[0].attributes.get(attributeName);
      for (const x of designItems) {
        let value = x.attributes.get(attributeName);
        if (value != lastValue) {
          lastValue = null;
          break;
        }
      }
      return lastValue;
    }
    return null;
  }

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return null;
  }
}