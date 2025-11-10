import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';

export class AttributeAndPropertyChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, attributeName: string, propertyName: string, newValue: any | IBinding | null, oldValue: any | IBinding | null) {
    this.title = "Change Attribute & Property" + attributeName + " of &lt;" + designItem.name + "&gt;";

    this.designItem = designItem;
    this.attributeName = attributeName;
    this.propertyName = propertyName;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    this.designItem.element[this.propertyName] = this.oldValue;
    if (this.oldValue == null) {
      this.designItem._withoutUndoRemoveAttribute(this.attributeName);
      try {
        this.designItem.element.removeAttribute(this.attributeName);
      }
      catch (e) {
        if (e?.code !== 5)
          console.warn(e)
      }
    }
    else {
      this.designItem._withoutUndoSetAttribute(<string>this.attributeName, this.oldValue);
      if (this.attributeName != "draggable") {
        try {
          if (typeof this.oldValue === 'string')
            this.designItem.element.setAttribute(this.attributeName, this.oldValue);
        }
        catch (e) {
          if (e?.code !== 5)
            console.warn(e)
        }
      }
    }
  }

  do() {
    this.designItem.element[this.propertyName] = this.newValue;
    if (this.newValue == null) {
      this.designItem._withoutUndoRemoveAttribute(<string>this.attributeName);
      try {
        this.designItem.element.removeAttribute(this.attributeName);
      }
      catch (e) {
        if (e?.code !== 5)
          console.warn(e)
      }
    }
    else {
      this.designItem._withoutUndoSetAttribute(<string>this.attributeName, this.newValue);
      if (this.attributeName != "draggable") {
        try {
          if (typeof this.newValue === 'string')
            this.designItem.element.setAttribute(this.attributeName, this.newValue);
        }
        catch (e) {
          if (e?.code !== 5)
            console.warn(e)
        }
      }
    }
  }

  public designItem: IDesignItem;
  public attributeName: any;
  public propertyName: any;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    if (other instanceof AttributeAndPropertyChangeAction && this.designItem === other.designItem && this.attributeName === other.attributeName && this.propertyName === other.propertyName) {
      this.newValue = other.newValue;
      return true;
    }
    return false
  }
}