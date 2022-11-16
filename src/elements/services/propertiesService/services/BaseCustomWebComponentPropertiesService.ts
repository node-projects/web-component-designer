import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { BaseCustomWebComponentLazyAppend, BaseCustomWebComponentConstructorAppend, BaseCustomWebComponentNoAttachedTemplate, BaseCustomWebComponentConstructorAppendLazyReady } from '@node-projects/base-custom-webcomponent';
import { AbstractPolymerLikePropertiesService } from './AbstractPolymerLikePropertiesService';

export class BaseCustomWebComponentPropertiesService extends AbstractPolymerLikePropertiesService {
  
  public name = "baseCustomWebComponent";

  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.element instanceof BaseCustomWebComponentLazyAppend ||
      designItem.element instanceof BaseCustomWebComponentConstructorAppendLazyReady ||
      designItem.element instanceof BaseCustomWebComponentConstructorAppend;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
    //@ts-ignore
    (<BaseCustomWebComponentNoAttachedTemplate><any>designItem.element)._parseAttributesToProperties();
  }
}