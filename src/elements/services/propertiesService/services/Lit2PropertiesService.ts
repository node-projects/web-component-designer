import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { AbstractBasePropertiesService } from "./AbstractBasePropertiesService";
import { PropertiesHelper } from './PropertiesHelper';

export class Lit2PropertiesService extends AbstractBasePropertiesService {

  public override name = "lit2"

  override isHandledElement(designItem: IDesignItem): boolean {
    let prop = (<any>designItem.element.constructor).elementProperties;
    if (prop)
      return true;
    return false;
  }

  public override getProperties(designItem: IDesignItem): IProperty[] {
    if (!this.isHandledElement(designItem))
      return null;
      let properties: IProperty[] = [];
      for (const p of (<any>designItem.element.constructor).elementProperties.entries()) {
        let name = p[0];
        const litProperty = p[1];
        let type = litProperty;
        if (litProperty.type)
          type = litProperty.type;
  
        if (type === String) {
          let property: IProperty = { name: name, type: "string", service: this };
          properties.push(property);
        } else if (type === Object) {
          let property: IProperty = { name: name, type: "string", service: this };
          properties.push(property);
        } else if (type === Number) {
          let property: IProperty = { name: name, type: "number", service: this };
          properties.push(property);
        } else if (type === Date) {
          let property: IProperty = { name: name, type: "date", service: this };
          properties.push(property);
        } else if (type === Boolean) {
          let property: IProperty = { name: name, type: "boolean", service: this };
          properties.push(property);
        } else if (PropertiesHelper.isTypescriptEnum(type)) {
          let property: IProperty = { name: name, type: "enum", enumValues: PropertiesHelper.getTypescriptEnumEntries(type), service: this };
          properties.push(property);
        }
      }
      return properties;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }
}