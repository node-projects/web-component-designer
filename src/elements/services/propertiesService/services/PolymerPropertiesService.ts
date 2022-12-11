import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { AbstractPolymerLikePropertiesService } from './AbstractPolymerLikePropertiesService.js';

export class PolymerPropertiesService extends AbstractPolymerLikePropertiesService {

  public name = "polymer"

  override isHandledElement(designItem: IDesignItem): boolean {
    return (<any>designItem.element.constructor).polymerElementVersion != null;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
    (<{ set: (name: string, value: any) => void }><any>designItem.element).set(property.name, value);
  }
}