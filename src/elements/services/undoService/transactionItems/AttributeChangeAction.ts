import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

export class AttributeChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: string, newValue: any, oldValue: any) {
    this.title = "Change Attribute";

    this.designItem = designItem;
    this.name = name;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    if (this.oldValue == null) {
      this.designItem.attributes.delete(this.name);
      this.designItem.element.removeAttribute(this.name);
    }
    else {
      this.designItem.attributes.set(<string>this.name, this.oldValue);
      if (this.name != "draggable") {
        this.designItem.element.setAttribute(this.name, this.oldValue);
      }
    }
  }

  do() {
    if (this.newValue == null) {
      this.designItem.attributes.delete(<string>this.name);
      this.designItem.element.removeAttribute(this.name);
    }
    else {
      this.designItem.attributes.set(<string>this.name, this.newValue);
      if (this.name != "draggable") {
        this.designItem.element.setAttribute(this.name, this.newValue);
      }
    }
  }

  public designItem: IDesignItem;
  public name: string;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    if (other instanceof AttributeChangeAction && this.designItem === other.designItem && this.name === other.name) {
      this.newValue = other.newValue;
      return true;
    }
    return false
  }
}