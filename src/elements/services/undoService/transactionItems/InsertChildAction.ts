import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

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

  undo() {
    if (this.oldParent)
      this.oldParent._insertChildInternal(this.designItem, this.oldIndex);
    else
      this.designItem.parent._removeChildInternal(this.designItem);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'moved', designItems: [this.designItem] });
  }

  do() {
    this.oldParent = this.designItem.parent;
    if (this.oldParent)
      this.oldIndex = this.designItem.parent.indexOf(this.designItem);
    this.newParent._insertChildInternal(this.designItem, this.newIndex);
    this.affectedItems[0].instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'moved', designItems: [this.designItem] });
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