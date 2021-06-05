import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

export class InsertAction implements ITransactionItem {

  constructor(designItem: IDesignItem, index: number, newItem: IDesignItem) {
    this.title = "Insert Item";

    this.designItem = designItem;
    this.index = index;
    this.newItem = newItem;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    (<Element><unknown>this.newItem.element).remove();
  }

  do() {
    this.designItem.insertChild(this.newItem, this.index);
  }

  public designItem: IDesignItem;
  public index: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}