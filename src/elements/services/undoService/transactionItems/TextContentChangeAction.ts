import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IBinding } from '../../../item/IBinding.js';

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

  undo() {
    this.designItem.element.textContent = this.oldValue;
  }

  do() {
    this.designItem.element.textContent = this.newValue;
  }

  public designItem: IDesignItem;
  public newValue: any;
  public oldValue: any;

  mergeWith(other: ITransactionItem) {
    return false
  }
}