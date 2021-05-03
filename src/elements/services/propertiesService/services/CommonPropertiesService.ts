import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";

export class CommonPropertiesService implements IPropertiesService {

  //@ts-ignore
  private commonProperties: IProperty[] = [
    {
      name: "id",
      type: "string",
      service: this
    }, {
      name: "class",
      type: "string",
      service: this
    }, {
      name: "title",
      type: "string",
      service: this
    }, {
      name: "tabindex",
      type: "number",
      service: this
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

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.attributes.delete(<string>property.name);
      d.element.removeAttribute(property.name);
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

  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return property.defaultValue;
  }
}
