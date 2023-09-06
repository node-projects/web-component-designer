import { IPropertiesService, RefreshMode } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ValueType } from '../ValueType.js';
import { IBinding } from "../../../item/IBinding.js";
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType.js';

export class AttributesPropertiesService implements IPropertiesService {

  public name = "attributes"

  public getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.attribute };
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    if (designItem) {
      let p: IProperty[] = [];
      for (let a of designItem.attributes()) {
        p.push({ name: a[0], renamable: true, type: 'string', service: this, propertyType: PropertyType.attribute })
      }
      p.push({ name: '', type: 'addNew', service: this, propertyType: PropertyType.complex });
      return p;
    }
    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed");
    for (let d of designItems) {
      d.setAttribute(<string>property.name, value);
    }
    cg.commit();
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.attribute;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.removeAttribute(<string>property.name);
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
    }
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      if (designItems.length == 1 && typeof designItems[0].getAttribute(property.name) == 'object')
        return ValueType.bound;
      let attributeName = property.name;
      designItems.forEach((x) => {
        let has = x.hasAttribute(attributeName);
        all = all && has;
        some = some || has;
      });

      //todo: optimize perf, do not call bindings service for each property. 
      const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.getBindings(designItems[0]);
      });
      if (bindings && bindings.find(x => x.target == BindingTarget.property && x.targetName == property.name))
        return ValueType.bound;
    }
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  getValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      let attributeName = property.name;
      let lastValue = designItems[0].getAttribute(attributeName);
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
