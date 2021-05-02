import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { PropertiesHelper } from './PropertiesHelper';

export class UnkownElementPropertiesService implements IPropertiesService {

  public readonly name: string = "unkown";

  public isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  protected _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    let attributeName = PropertiesHelper.camelToDashCase(property.name);
    for (let d of designItems) {
      if (property.type === 'object')
        d.setAttribute(attributeName, JSON.stringify(value));
      else if (property.type == 'boolean' && !value)
        d.removeAttribute(attributeName);
      else if (property.type == 'boolean' && value)
        d.setAttribute(attributeName, "");
      else
        d.setAttribute(attributeName, value);
      this._notifyChangedProperty(d, property, value);
    }
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.removeAttribute(property.name);
      this._notifyChangedProperty(d, property, undefined);
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
      if (property.type == 'boolean')
        return designItems[0].attributes.has(attributeName);
      let lastValue = designItems[0].attributes.get(attributeName);
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