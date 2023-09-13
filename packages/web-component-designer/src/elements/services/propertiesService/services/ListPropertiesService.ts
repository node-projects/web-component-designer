import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IJsonPropertyDefinitions } from './IJsonPropertyDefinitions.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export class ListPropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  public name = "list"

  private _propertys: Map<string, IProperty[]> = new Map();

  constructor(propertyDefinitions: IJsonPropertyDefinitions) {
    super();

    for (let e in propertyDefinitions) {
      let parr: IProperty[] = []
      this._propertys.set(e, parr);
      for (let p in propertyDefinitions[e]) {
        let pdef = propertyDefinitions[e][p];
        parr.push(
          {
            name: pdef.name,
            propertyName: pdef.propertyName,
            attributeName: pdef.attributeName,
            description: pdef.description,
            type: pdef.type,
            default: pdef.default,
            min: pdef.min,
            max: pdef.max,
            step: pdef.step,
            values: pdef.values,
            enumValues: pdef.enumValues,
            value: pdef.value,
            defaultValue: pdef.defaultValue,
            service: this,
            propertyType: pdef.propertyType ?? PropertyType.propertyAndAttribute
          });
      }
    }
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return this._propertys.has(designItem.element.localName);
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    return this._propertys.get(designItem.element.localName);
  }
}