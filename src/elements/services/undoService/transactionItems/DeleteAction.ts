import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper';
import { IExtensionManager } from '../../../widgets/designerView/extensions/IExtensionManger';

export class DeleteAction implements ITransactionItem {

  constructor(deletedItems: IDesignItem[], extensionManager: IExtensionManager) {
    this.title = "Delete Items";
    this.deletedItems = deletedItems;
    this.extensionManager = extensionManager;
  }

  title?: string;

  get affectedItems() {
    return this.deletedItems;
  }

  undo() {
    for (let n = 0; n < this.deletedItems.length; n++) {
      this._parentItems[n].insertChild(this.deletedItems[n], this._parentIndexes[n]);
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
      this.deletedItems[n].remove();
    }
    this.extensionManager.removeExtensions(this.deletedItems);
  }

  public deletedItems: IDesignItem[];
  public extensionManager: IExtensionManager;
  private _parentItems: IDesignItem[];
  private _parentIndexes: number[];

  mergeWith(other: ITransactionItem) {
    return false
  }
}