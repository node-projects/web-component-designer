import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';

export class AttributeChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: string, newValue: string | IBinding | null, oldValue: string | IBinding | null) {
    this.title = "Change Attribute " + name + " of &lt;" + designItem.name + "&gt;";

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
      this.designItem._withoutUndoRemoveAttribute(this.name);
      try {
        this.designItem.element.removeAttribute(this.name);
      }
      catch (e) {
        console.warn(e)
      }
    }
    else {
      this.designItem._withoutUndoSetAttribute(<string>this.name, this.oldValue);
      if (this.name != "draggable") {
        try {
          if (typeof this.oldValue === 'string')
            this.designItem.element.setAttribute(this.name, this.oldValue);
        }
        catch (e) {
          console.warn(e)
        }
      }
    }
  }

  do() {
    if (this.newValue == null) {
      this.designItem._withoutUndoRemoveAttribute(<string>this.name);
      try {
        this.designItem.element.removeAttribute(this.name);
      }
      catch (e) {
        console.warn(e)
      }
    }
    else {
      this.designItem._withoutUndoSetAttribute(<string>this.name, this.newValue);
      if (this.name != "draggable") {
        try {
          if (typeof this.newValue === 'string')
            this.designItem.element.setAttribute(this.name, this.newValue);
        }
        catch (e) {
          console.warn(e)
        }
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