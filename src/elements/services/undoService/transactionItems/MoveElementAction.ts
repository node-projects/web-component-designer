import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';

export class MoveElementAction implements ITransactionItem {

  constructor(designItem: IDesignItem, newTarget: IDesignItem, newPosition: InsertPosition, oldTarget: IDesignItem, oldPosition: InsertPosition) {
    this.title = "Move Item";

    this.designItem = designItem;
    this.newTarget = newTarget;
    this.newPosition = newPosition;
    this.oldTarget = oldTarget;
    this.oldPosition = oldPosition;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem, this.newTarget, this.oldTarget];
  }

  undo() {
    (<HTMLElement>this.oldTarget.element).insertAdjacentElement(this.oldPosition, this.designItem.element);
  }

  do() {
    (<HTMLElement>this.newTarget.element).insertAdjacentElement(this.newPosition, this.designItem.element);
  }

  public designItem: IDesignItem;
  public newTarget: IDesignItem;
  public newPosition: InsertPosition;
  public oldTarget: IDesignItem;
  public oldPosition: InsertPosition;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}