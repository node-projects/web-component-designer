import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

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

  undo(): IContentChanged[] | null {
    this.newItem.parent._removeChildInternal(this.newItem);
    return [{ changeType: 'removed', designItems: [this.newItem] }];
  }

  do(): IContentChanged[] | null {
    this.containerItem._insertChildInternal(this.newItem, this.index);
    return [{ changeType: 'added', designItems: [this.newItem] }];
  }

  public containerItem: IDesignItem;
  public index: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}