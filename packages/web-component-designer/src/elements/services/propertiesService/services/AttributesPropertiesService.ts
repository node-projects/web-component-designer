import { RefreshMode } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ValueType } from '../ValueType.js';
import { IBinding } from "../../../item/IBinding.js";
import { BindingTarget } from '../../../item/BindingTarget.js';
import { PropertyType } from '../PropertyType.js';
import { PropertiesHelper } from './PropertiesHelper.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';

export class AttributesPropertiesService extends AbstractPropertiesService {

  public name = "attributes"

  public getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return !designItem.isRootItem;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.attribute };
  }

  getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
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

  override async setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed");
    for (let d of designItems) {
      d.setAttribute(<string>property.name, value);
    }
    cg.commit();
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.attribute;
  }

  override clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.removeAttribute(<string>property.name);
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
    }
  }

  override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      if (designItems.length == 1 && typeof designItems[0].getAttribute(property.name) == 'object')
        return ValueType.bound;
      let propName = PropertiesHelper.dashToCamelCase(property.name);
      let attributeName = property.name;
      designItems.forEach((x) => {
        let has = x.hasAttribute(attributeName);
        all = all && has;
        some = some || has;
      });
      const bindings = AbstractPropertiesService.getOrBuildCachedBindings(designItems[0]);
      if (bindings && bindings.find(x => x.target == BindingTarget.attribute && x.targetName == propName))
        return ValueType.bound;
    }
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  override getValue(designItems: IDesignItem[], property: IProperty) {
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

  override getBinding(designItems: IDesignItem[], property: IProperty): IBinding {
    const bindings = AbstractPropertiesService.getOrBuildCachedBindings(designItems[0]);
    return bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.explicitProperty || x.target == BindingTarget.attribute) && x.targetName == property.name);
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return property.defaultValue;
  }
}
