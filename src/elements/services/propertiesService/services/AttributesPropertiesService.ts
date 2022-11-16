import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { IBinding } from "../../../item/IBinding.js";
import { BindingTarget } from "../../../item/BindingTarget";
import { PropertyType } from "../PropertyType";

export class AttributesPropertiesService implements IPropertiesService {

  public name = "attributes"

  public listNeedsRefresh(designItem: IDesignItem): boolean {
    return true;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.propertyAndAttribute };
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    if (designItem) {
      let p: IProperty[] = [];
      for (let a of designItem.attributes.keys()) {
        p.push({ name: a, type: 'string', service: this, propertyType: PropertyType.propertyAndAttribute })
      }
      p.push({ name: '', type: 'addNew', service: this, propertyType: PropertyType.complex });
      return p;
    }
    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed");
    for (let d of designItems) {
      d.attributes.set(<string>property.name, value);
      d.element.setAttribute(property.name, value);
    }
    cg.commit();
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.attribute;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.attributes.delete(<string>property.name);
      d.element.removeAttribute(property.name);
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
    }
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

  getBinding(designItems: IDesignItem[], property: IProperty): IBinding {
    //TODO: optimize perf, do not call bindings service for each property. 
    const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
      return s.getBindings(designItems[0]);
    });
    return bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.attribute) && x.targetName == property.name);
  }

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return property.defaultValue;
  }
}
