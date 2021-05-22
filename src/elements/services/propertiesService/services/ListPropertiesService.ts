import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { IJsonPropertyDefinitions } from './IJsonPropertyDefinitions';
import { UnkownElementPropertiesService } from './UnkownElementPropertiesService';

export class ListPropertiesService extends UnkownElementPropertiesService {

  public override name = "list"

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
            service: this
          });
      }
    }
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return this._propertys.has(designItem.element.localName);
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  override getProperties(designItem: IDesignItem): IProperty[] {
    return this._propertys.get(designItem.element.localName);
  }
}