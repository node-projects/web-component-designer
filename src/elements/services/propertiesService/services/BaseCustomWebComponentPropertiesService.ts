import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { BaseCustomWebComponentLazyAppend, BaseCustomWebComponentConstructorAppend, BaseCustomWebComponentNoAttachedTemplate } from '@node-projects/base-custom-webcomponent';
import { AbstractBasePropertiesService } from './AbstractBasePropertiesService';

export class BaseCustomWebComponentPropertiesService extends AbstractBasePropertiesService {
  public name = "baseCustomWebComponent";

  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.element instanceof BaseCustomWebComponentLazyAppend || designItem.element instanceof BaseCustomWebComponentConstructorAppend;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
    //@ts-ignore
    (<BaseCustomWebComponentNoAttachedTemplate><any>designItem.element)._parseAttributesToProperties();
  }
}