import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { IBinding } from "../../../item/IBinding.js";
import { BindingTarget } from "../../../item/BindingTarget";

export class AttributesPropertiesService implements IPropertiesService {
  
  public name = "attributes"

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this };
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    if (designItem) {
      let p: IProperty[] = [];
      for (let a of designItem.attributes.keys()) {
        p.push({ name: a, type: 'string', service: this })
      }
      return p;
    }
    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {

  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.attribute;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {

  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      if (designItems.length == 1 && typeof designItems[0].attributes.get(property.name) == 'object')
        return ValueType.bound;
      let attributeName = property.name;
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
      let attributeName = property.name;
      let lastValue = designItems[0].attributes.get(attributeName);
      if (typeof lastValue === 'object')
        return (<IBinding>lastValue).rawValue;
      /*
      for (const x of designItems) {
        let value = x.attributes.get(attributeName);
        if (value != lastValue) {
          lastValue = null;
          break;
        }
      }
      */
      return lastValue;
    }
    return null;
  }

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return property.defaultValue;
  }
}
