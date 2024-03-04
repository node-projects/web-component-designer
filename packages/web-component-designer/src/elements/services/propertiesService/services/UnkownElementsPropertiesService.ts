import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { PropertyType } from '../PropertyType.js';

export class UnkownElementsPropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    let list = Object.getOwnPropertyNames(Object.getPrototypeOf(designItem.element));
    let props: IProperty[] = [];
    for (let p of list) {
      if (p.startsWith('on'))
        continue;
      let desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(designItem.element), p);
      if (desc.get || desc.set) {
        let v = designItem.element[p];
        if (typeof v == 'boolean')
          props.push({ name: p, type: 'boolean', service: this, propertyType: PropertyType.propertyAndAttribute });
        else if (typeof v == 'number')
          props.push({ name: p, type: 'bonumberolean', service: this, propertyType: PropertyType.propertyAndAttribute });
        else
          props.push({ name: p, type: 'string', service: this, propertyType: PropertyType.propertyAndAttribute });
      }
    }
    return props;
  }
}