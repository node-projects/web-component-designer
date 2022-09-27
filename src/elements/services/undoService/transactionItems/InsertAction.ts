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
    return [this.designItem, this.newItem];
  }

  undo() {
    this.newItem.parent._removeChildInternal(this.newItem);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'removed', designItems: [this.newItem] });
  }

  do() {
    this.designItem._insertChildInternal(this.newItem, this.index);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'added', designItems: [this.newItem] });
  }

  public designItem: IDesignItem;
  public index: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}