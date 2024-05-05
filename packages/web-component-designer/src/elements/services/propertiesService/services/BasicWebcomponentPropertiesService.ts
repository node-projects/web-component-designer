import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { PropertiesHelper } from './PropertiesHelper.js';

export class BasicWebcomponentPropertiesService extends AbstractPropertiesService {

  public name = "webcomponent"

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    //@ts-ignore
    const attr = designItem.element.constructor?.observedAttributes;
    if (attr && attr.length > 0) {
      return true;
    }
    return false;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return (<IProperty[]>this.getProperties(designItem)).find(x => x.name == name);
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    //@ts-ignore
    const attr: string[] = designItem.element.constructor?.observedAttributes;

    return attr.map(x => ({
      name: PropertiesHelper.dashToCamelCase(x),
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }));
  }
}
