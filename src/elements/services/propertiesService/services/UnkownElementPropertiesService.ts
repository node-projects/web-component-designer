import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { PropertiesHelper } from './PropertiesHelper';
import { BindingTarget } from "../../../item/BindingTarget";

//@ts-ignore
export abstract class UnkownElementPropertiesService implements IPropertiesService {

  public isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  protected _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return null;
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const attributeName = PropertiesHelper.camelToDashCase(property.name);
    const cg = designItems[0].openGroup("properties changed", designItems);
    try {
      for (let d of designItems) {
        if (property.type === 'object') {
          const json = JSON.stringify(value);
          d.attributes.set(attributeName, json);
          d.element.setAttribute(attributeName, json);
        } else if (property.type == 'boolean' && !value) {
          d.attributes.delete(attributeName);
          d.element.removeAttribute(attributeName);
        } else if (property.type == 'boolean' && value) {
          d.attributes.set(attributeName, "");
          d.element.setAttribute(attributeName, "");
        } else {
          d.attributes.set(attributeName, value);
          d.element.setAttribute(attributeName, value);
        }
        this._notifyChangedProperty(d, property, value);
      }
      cg.commit();
    }
    catch (err) {
      console.log(err);
      cg.undo();
    }
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.property;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    const attributeName = PropertiesHelper.camelToDashCase(property.name);
    for (let d of designItems) {
      d.attributes.delete(attributeName);
      d.element.removeAttribute(attributeName);
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
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