import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { BindingTarget } from "../../../item/BindingTarget";
import { PropertyType } from "../PropertyType";
import { IBinding } from "../../../item/IBinding";

export class CommonPropertiesService implements IPropertiesService {

  public listNeedsRefresh(designItem: IDesignItem): boolean {
    return true;
  }

  //@ts-ignore
  private commonProperties: IProperty[] = [
    {
      name: "id",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "class",
      type: "string",
      service: this,
      attributeName: "class",
      propertyName: "className",
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "title",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "tabindex",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  public name = "common"

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return this.commonProperties[name];
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    return this.commonProperties;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    for (let d of designItems) {
      if (property.type == 'boolean' && !value) {
        d.attributes.delete(<string>property.name);
        d.element.removeAttribute(property.name);
      }
      else if (property.type == 'boolean' && value) {
        d.attributes.set(<string>property.name, "");
        d.element.setAttribute(property.name, "");
      }
      else {
        d.attributes.set(<string>property.name, value);
        d.element.setAttribute(property.name, value);
      }
    }
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.property;
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
      let attributeName = property.name;
      designItems.forEach((x) => {
        let has = x.attributes.has(attributeName);
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
