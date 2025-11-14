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

  protected parseProperties(list: any): IPropertyGroup[] | IProperty[] {
    let groups: IPropertyGroup[] | IProperty[] = [];

    let names = Object.keys(list);
    const grouped = Object.groupBy(names, x => list[x].group ?? '');

    for (let grp in grouped) {
      const pg: IPropertyGroup = { name: grp, properties: [] };
      for (const name of grouped[grp]) {
        const polymerProperty = list[name];
        let type = polymerProperty;
        let description = null;
        let example = null;
        let readonly = false;
        let propertyType = PropertyType.propertyAndAttribute;
        if (polymerProperty.type) {
          type = polymerProperty.type;
          description = polymerProperty.description;
          example = polymerProperty.example;
          readonly = polymerProperty.readonly;
          propertyType = polymerProperty.readonly ? PropertyType.property : PropertyType.propertyAndAttribute;
        }

        if (type === String) {
          let property: IProperty = { name, type: "string", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (type === Object) {
          let property: IProperty = { name, type: "object", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (type === Number) {
          let property: IProperty = { name, type: "number", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (type === Date) {
          let property: IProperty = { name, type: "date", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (type === Boolean) {
          let property: IProperty = { name, type: "boolean", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (PropertiesHelper.isTypescriptEnum(type)) {
          let property: IProperty = { name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(type), service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else if (typeof type === 'string') {
          let property: IProperty = { name, type: type, service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        } else {
          let property: IProperty = { name, type: "string", service: this, propertyType, description, example, readonly };
          pg.properties.push(property);
        }
      }
      if (pg.name == '')
        //@ts-ignore
        groups.push(...pg.properties);
      else
        //@ts-ignore
        groups.push(pg);
    }
    return groups;
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return designItems[0].element[property.propertyName ?? property.name];
  }
}