import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertiesHelper } from './PropertiesHelper.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export abstract class AbstractPolymerLikePropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnClassChange;
  }

  public override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    if (!this.isHandledElement(designItem))
      return null;
    return this.parseProperties((<any>designItem.element.constructor).properties);
  }

  protected parseProperties(list: any): IProperty[] {
    let properties: IProperty[] = [];
    for (const name in list) {
      const polymerProperty = list[name];
      let type = polymerProperty;
      let description = null;
      let example = null;
      let readonly = false;
      if (polymerProperty.type) {
        type = polymerProperty.type;
        description = polymerProperty.description;
        example = polymerProperty.example;
        readonly = polymerProperty.readonly;
      }

      if (type === String) {
        let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else if (type === Object) {
        let property: IProperty = { name: name, type: "object", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else if (type === Number) {
        let property: IProperty = { name: name, type: "number", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else if (type === Date) {
        let property: IProperty = { name: name, type: "date", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else if (type === Boolean) {
        let property: IProperty = { name: name, type: "boolean", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else if (PropertiesHelper.isTypescriptEnum(type)) {
        let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(type), service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      } else {
        let property: IProperty = { name: name, type: "string", service: this, propertyType: PropertyType.propertyAndAttribute, description: description, example: example, readonly };
        properties.push(property);
      }
    }
    return properties;
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return designItems[0].element[property.propertyName ?? property.name];
  }
}