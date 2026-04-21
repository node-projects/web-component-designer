import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { DomHelper } from '@node-projects/base-custom-webcomponent';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class DeleteAction implements ITransactionItem {

  constructor(deletedItems: IDesignItem[]) {
    this.title = "Delete Items";
    this.deletedItems = deletedItems;
  }

  title?: string;

  get affectedItems() {
    return this.deletedItems;
  }

  undo(): IContentChanged[] | null {
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems[n]._insertChildInternal(this.deletedItems[n], this._parentIndexes[n]);
    }
    return [{ changeType: 'added', designItems: this.deletedItems }];
  }

  do(): IContentChanged[] | null {
    this._parentItems = [];
    this._parentIndexes = [];
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems.push(this.deletedItems[n].parent);
      this._parentIndexes.push(DomHelper.nodeIndex(this.deletedItems[n].element));
    }
    for (let n = 0; n < this.deletedItems.length; n++) {
      this.deletedItems[n].parent._removeChildInternal(this.deletedItems[n]);
    }
    return [{ changeType: 'removed', designItems: this.deletedItems }];
  }

  public deletedItems: IDesignItem[];
  private _parentItems: IDesignItem[];
  private _parentIndexes: number[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}