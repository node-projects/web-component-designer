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
      if (this._parentIndexes[n] == 0)
        (<Element><unknown>this._parentItems[n].element).insertAdjacentElement('afterbegin', this.deletedItems[n].element);
      else {
        let el = (<Element><unknown>this._parentItems[n].element).children[this._parentIndexes[n] - 1];
        el.insertAdjacentElement('afterend', this.deletedItems[n].element)
      }
    }
  }

  do() {
    this._parentItems = [];
    this._parentIndexes = [];
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems.push(this.deletedItems[n].parent);
      this._parentIndexes.push(DomHelper.nodeIndex(this.deletedItems[n].element));
    }
    for (let n = 0; n < this.deletedItems.length; n++) {
      (<Element><unknown>this.deletedItems[n].element).remove();
    }
  }

  public deletedItems: IDesignItem[];
  private _parentItems: IDesignItem[];
  private _parentIndexes: number[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}