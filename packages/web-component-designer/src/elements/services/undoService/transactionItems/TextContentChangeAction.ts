import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class TextContentChangeAction implements ITransactionItem {

  constructor(designItem: IDesignItem, newValue: string | IBinding | null, oldValue: string | IBinding | null) {
    this.title = "Change TextContent from '" + oldValue + "' to '" + newValue + "'";

    this.designItem = designItem;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo(): IContentChanged[] | null {
    this.designItem.element.textContent = this.oldValue;
    return [{ changeType: 'changed', designItems: this.affectedItems, type: 'property', name: 'textContent', oldValue: this.newValue, newValue: this.oldValue }];
  }

  do(): IContentChanged[] | null {
    this.designItem.element.textContent = this.newValue;
    return [{ changeType: 'changed', designItems: this.affectedItems, type: 'property', name: 'textContent', oldValue: this.oldValue, newValue: this.newValue }];
  }

  public designItem: IDesignItem;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    return false
  }
}