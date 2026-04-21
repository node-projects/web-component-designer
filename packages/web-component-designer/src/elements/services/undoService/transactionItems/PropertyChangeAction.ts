import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { setDeepValue } from '../../../helper/Helper.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class PropertyChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, name: string, newValue: any, oldValue: any) {
    this.title = "Change Property " + name + " of &lt;" + designItem.name + "&gt;";

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
    setDeepValue(this.designItem.node, this.name, this.oldValue);
    return [{ changeType: 'changed', type: 'property', name: this.name, designItems: [this.designItem] }];
  }

  do(): IContentChanged[] | null {
    setDeepValue(this.designItem.node, this.name, this.newValue);
    return [{ changeType: 'changed', type: 'property', name: this.name, designItems: [this.designItem] }];
  }

  public designItem: IDesignItem;
  public name: string;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    if (other instanceof PropertyChangeAction && this.designItem === other.designItem && this.name === other.name) {
      this.newValue = other.newValue;
      return true;
    }
    return false
  }
}