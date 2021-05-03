import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { IProperty } from '../../propertiesService/IProperty';

export class PropertyChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, property: IProperty, newValue: any, oldValue: any) {
    this.title = "Change Property";

    this.designItem = designItem;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    if (this.oldValue == null)
      this.property.service.clearValue([this.designItem], this.property);
    else
      this.property.service.setValue([this.designItem], this.property, this.oldValue);
  }

  do() {
    if (this.newValue == null)
      this.property.service.clearValue([this.designItem], this.property);
    else
      this.property.service.setValue([this.designItem], this.property, this.newValue);
  }

  public designItem: IDesignItem;
  public property: IProperty;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    if (other instanceof PropertyChangeAction && this.designItem === other.designItem && this.property === other.property) {
      this.newValue = other.newValue;
      return true;
    }
    return false
  }
}