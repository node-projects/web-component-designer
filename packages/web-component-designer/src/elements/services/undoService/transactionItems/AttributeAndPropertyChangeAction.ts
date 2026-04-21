import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

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

  undo(): IContentChanged[] | null {
    this.designItem.element[this.propertyName] = this.oldValue;
    if (this.oldValue == null) {
      this.designItem._withoutUndoRemoveAttribute(this.attributeName);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: null }];
    } else {
      let val = this.oldValue;
      if (typeof this.oldValue !== 'string')
        val = this.oldValue.toString();
      this.designItem._withoutUndoSetAttribute(<string>this.attributeName, val);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: val }];
    }
  }

  do(): IContentChanged[] | null {
    this.designItem.element[this.propertyName] = this.newValue;
    if (this.newValue == null) {
      this.designItem._withoutUndoRemoveAttribute(<string>this.attributeName);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.newValue, newValue: null }];
    } else {
      let val = this.newValue;
      if (typeof this.newValue !== 'string')
        val = this.newValue.toString();
      this.designItem._withoutUndoSetAttribute(<string>this.attributeName, val);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.attributeName, oldValue: this.oldValue, newValue: val }];
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