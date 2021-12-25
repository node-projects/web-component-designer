import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper';

export class DeleteAction implements ITransactionItem {

  constructor(deletedItems: IDesignItem[]) {
    this.title = "Delete Items";
    this.deletedItems = deletedItems;
  }

  title?: string;

  get affectedItems() {
    return this.deletedItems;
  }

  undo() {
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems[n]._insertChildInternal(this.deletedItems[n], this._parentIndexes[n]);
    }
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({changeType: 'added', designItems: this.deletedItems});
  }

  do() {
    this._parentItems = [];
    this._parentIndexes = [];
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems.push(this.deletedItems[n].parent);
      this._parentIndexes.push(DomHelper.nodeIndex(this.deletedItems[n].element));
    }
    for (let n = 0; n < this.deletedItems.length; n++) {
      this.deletedItems[n].remove();
    }
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({changeType: 'removed', designItems: this.deletedItems});
  }

  public deletedItems: IDesignItem[];
  private _parentItems: IDesignItem[];
  private _parentIndexes: number[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}