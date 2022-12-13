import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';

export class InsertAction implements ITransactionItem {

  constructor(containerItem: IDesignItem, index: number, newItem: IDesignItem) {
    this.title = "Insert Item";

    this.containerItem = containerItem;
    this.index = index;
    this.newItem = newItem;
  }

  title?: string;

  get affectedItems() {
    return [this.containerItem, this.newItem];
  }

  undo() {
    this.newItem.parent._removeChildInternal(this.newItem);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'removed', designItems: [this.newItem] });
  }

  do() {
    this.containerItem._insertChildInternal(this.newItem, this.index);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'added', designItems: [this.newItem] });
  }

  public containerItem: IDesignItem;
  public index: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}