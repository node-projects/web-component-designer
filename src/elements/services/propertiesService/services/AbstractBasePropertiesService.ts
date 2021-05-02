import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { PropertiesHelper } from './PropertiesHelper';
import { UnkownElementPropertiesService } from "./UnkownElementPropertiesService";

export abstract class AbstractBasePropertiesService extends UnkownElementPropertiesService {

  public override getProperties(designItem: IDesignItem): IProperty[] {
    if (!this.isHandledElement(designItem))
      return null;

    let properties: IProperty[] = [];
    let list = (<any>designItem.element.constructor).properties;
    for (const name in list) {
      const polymerProperty = list[name];
      if (polymerProperty === String) {
        let property: IProperty = { name: name, type: "string", service: this };
        properties.push(property);
      } else if (polymerProperty === Object) {
        let property: IProperty = { name: name, type: "string", service: this };
        properties.push(property);
      } else if (polymerProperty === Number) {
        let property: IProperty = { name: name, type: "number", service: this };
        properties.push(property);
      } else if (polymerProperty === Date) {
        let property: IProperty = { name: name, type: "date", service: this };
        properties.push(property);

      } else if (PropertiesHelper.isTypescriptEnum(polymerProperty)) {
        let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(polymerProperty), service: this };
        properties.push(property);
      } else {
        if (polymerProperty.type === String) {
          let property: IProperty = { name: name, type: "string", service: this };
          properties.push(property);
        } else if (polymerProperty.type === Object) {
          let property: IProperty = { name: name, type: "string", service: this };
          properties.push(property);
        } else if (polymerProperty.type === Number) {
          let property: IProperty = { name: name, type: "number", service: this };
          properties.push(property);
        } else if (polymerProperty.type === Date) {
          let property: IProperty = { name: name, type: "date", service: this };
          properties.push(property)
        } else if (PropertiesHelper.isTypescriptEnum(polymerProperty)) {
          let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(polymerProperty), service: this };
          properties.push(property);
        }
        else {
          let property: IProperty = { name: name, type: "string", service: this };
          properties.push(property);
        }
      }
    }
    return properties;
  }
}