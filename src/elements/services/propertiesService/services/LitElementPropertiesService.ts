import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { AbstractBasePropertiesService } from "./AbstractBasePropertiesService";

export class LitElementPropertiesService extends AbstractBasePropertiesService {

  public name = "lit"

  override isHandledElement(designItem: IDesignItem): boolean {
    let proto = (<any>designItem.element.constructor).__proto__;
    while (proto != null) {
      if (proto.name == 'LitElement')
        return true;
      if (proto.name == undefined || proto.name == 'HTMLElement' || proto.name == 'Element' || proto.name == 'Node' || proto.name == 'HTMLElement')
        return false;
      proto = proto.__proto__;
    }
    return false;
  }

  protected override _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }
}