import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { PropertyType } from "../PropertyType";
import { AbstractPropertiesService } from "./AbstractPropertiesService";

export class CommonPropertiesService extends AbstractPropertiesService {

  public override listNeedsRefresh(designItem: IDesignItem): boolean {
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

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this.commonProperties[name];
  }

  override getProperties(designItem: IDesignItem): IProperty[] {
    return this.commonProperties;
  }
}
