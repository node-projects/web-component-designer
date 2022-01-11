import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { AbstractBasePropertiesService } from './AbstractBasePropertiesService';

export class PolymerPropertiesService extends AbstractBasePropertiesService {

  public name = "polymer"

  override isHandledElement(designItem: IDesignItem): boolean {
    return (<any>designItem.element.constructor).polymerElementVersion != null;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
    (<{ set: (name: string, value: any) => void }><any>designItem.element).set(property.name, value);
  }
}