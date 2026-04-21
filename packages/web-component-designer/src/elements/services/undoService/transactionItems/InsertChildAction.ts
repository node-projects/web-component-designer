import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IContentChanged } from '../../InstanceServiceContainer.js';

export class InsertChildAction implements ITransactionItem {

  constructor(designItem: IDesignItem, newParent: IDesignItem, newIndex: number) {
    this.title = "Move or Insert Item";

    this.designItem = designItem;
    this.newParent = newParent;
    this.newIndex = newIndex;
  }

  title?: string;

  get affectedItems() {
    if (this.oldParent)
      return [this.designItem, this.newParent, this.oldParent];
    return [this.designItem, this.newParent];
  }

  undo(): IContentChanged[] | null {
    if (this.oldParent) {
      this.oldParent._insertChildInternal(this.designItem, this.oldIndex);
      return [{ changeType: 'moved', designItems: [this.designItem] }];
    } else {
      this.designItem.parent._removeChildInternal(this.designItem);
      return [{ changeType: 'removed', designItems: [this.designItem] }];
    }
  }

  do(): IContentChanged[] | null {
    this.oldParent = this.designItem.parent;
    if (this.oldParent)
      this.oldIndex = this.designItem.parent.indexOf(this.designItem);
    this.newParent._insertChildInternal(this.designItem, this.newIndex);
    return [{ changeType: this.oldParent ? 'moved' : 'added', designItems: [this.designItem] }];
  }

  public designItem: IDesignItem;
  public newParent: IDesignItem;
  public newIndex: number;
  public oldParent: IDesignItem;
  public oldIndex: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}