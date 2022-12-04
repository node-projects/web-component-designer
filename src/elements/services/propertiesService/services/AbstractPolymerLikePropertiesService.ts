import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { PropertiesHelper } from './PropertiesHelper';
import { AbstractPropertiesService } from "./AbstractPropertiesService";
import { PropertyType } from '../PropertyType';
import { RefreshMode } from '../IPropertiesService';

export abstract class AbstractPolymerLikePropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }
  
  public override getProperties(designItem: IDesignItem): IProperty[] {
    if (!this.isHandledElement(designItem))
      return null;
    return this.parseProperties((<any>designItem.element.constructor).properties);
  }

  protected parseProperties(list: any): IProperty[] {
    let properties: IProperty[] = [];
    for (const name in list) {
      const polymerProperty = list[name];
      let type = polymerProperty;
      if (polymerProperty.type)
        type = polymerProperty.type;

      if (type === String) {
        let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      } else if (type === Object) {
        let property: IProperty = { name: name, type: "object", service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      } else if (type === Number) {
        let property: IProperty = { name: name, type: "number", service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      } else if (type === Date) {
        let property: IProperty = { name: name, type: "date", service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      } else if (type === Boolean) {
        let property: IProperty = { name: name, type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      } else if (PropertiesHelper.isTypescriptEnum(type)) {
        let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(type), service: this, propertyType: PropertyType.propertyAndAttribute };
        properties.push(property);
      }
    }
    return properties;
  }
}