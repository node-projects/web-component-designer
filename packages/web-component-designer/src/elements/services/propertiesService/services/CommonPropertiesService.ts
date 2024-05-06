import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export class CommonPropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  //@ts-ignore
  private commonProperties: IProperty[] = [
    {
      name: "class",
      type: "string",
      service: this,
      attributeName: "class",
      propertyName: "className",
      propertyType: PropertyType.attribute
    }, {
      name: "title",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "part",
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

  override isHandledElement(designItem: IDesignItem): boolean {
    return !designItem.isRootItem;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this.commonProperties.find(x => x.name == name);
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    return this.commonProperties;
  }
}
