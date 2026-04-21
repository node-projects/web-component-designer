import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

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

  undo(): IContentChanged[] | null {
    if (this.oldValue == null) {
      this.designItem._withoutUndoRemoveAttribute(this.name);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: null }];
    } else {
      let val = this.oldValue;
      if (typeof this.oldValue !== 'string')
        val = this.oldValue.toString();
      this.designItem._withoutUndoSetAttribute(<string>this.name, val);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: val }];
    }
  }

  do(): IContentChanged[] | null {
    if (this.newValue == null) {
      this.designItem._withoutUndoRemoveAttribute(<string>this.name);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.newValue, newValue: null }];
    } else {
      let val = this.newValue;
      if (typeof this.newValue !== 'string')
        val = this.newValue.toString();
      this.designItem._withoutUndoSetAttribute(<string>this.name, val);
      return [{ changeType: 'changed', designItems: this.affectedItems, type: 'attribute', name: this.name, oldValue: this.oldValue, newValue: val }];
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