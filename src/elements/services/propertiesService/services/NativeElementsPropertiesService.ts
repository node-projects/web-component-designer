import { IPropertiesService } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";

export class NativeElementsPropertiesService implements IPropertiesService {

  //@ts-ignore
  private inputProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["text", "number", "button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "password", "radio", "range", "reset", "search", "submit", "tel", "time", "url", "week"],
      service: this,
      defaultValue: "text"
    }, {
      name: "value",
      type: "string",
      service: this
    }, {
      name: "checked",
      type: "boolean",
      service: this
    }, {
      name: "min",
      type: "number",
      service: this
    }, {
      name: "max",
      type: "number",
      service: this
    }
  ];

  private buttonProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["button", "submit", "reset"],
      service: this,
      defaultValue: "button"
    }, {
      name: "value",
      type: "string",
      service: this
    }, {
      name: "disabled",
      type: "boolean",
      service: this
    }
  ];

  public name = "native"

  isHandledElement(designItem: IDesignItem): boolean {
    switch (designItem.element.localName) {
      case 'input':
      case 'button':
      case 'a':
      case 'div':
        return true;
    }
    return false;
  }

  getProperties(designItem: IDesignItem): IProperty[] {
    if (!this.isHandledElement(designItem))
      return null;
    switch (designItem.element.localName) {
      case 'input':
        return this.inputProperties;
      case 'button':
        return this.buttonProperties;
      case 'a':
      case 'div':
    }

    return null;
  }

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    for (let d of designItems) {
      if (property.type == 'boolean' && !value) {
        d.removeAttribute(property.name);
      }
      else
        d.setAttribute(property.name, value);
    }
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    for (let d of designItems) {
      d.removeAttribute(property.name);
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
    return property.defaultValue;
  }
}
