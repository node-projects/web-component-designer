import { ITransactionItem } from '../ITransactionItem';
import { IDesignItem } from '../../../item/IDesignItem';
import { NodeType } from '../../../item/NodeType';

export class InsertAction implements ITransactionItem {

  constructor(designItem: IDesignItem, index: number, newItem: IDesignItem) {
    this.title = "Insert Item";

    this.designItem = designItem;
    this.index = index;
    this.newItem = newItem;
  }

  title?: string;

  get affectedItems() {
    return [this.designItem];
  }

  undo() {
    (<Element><unknown>this.newItem.element).remove();
  }

  do() {
    if (this.index == 0)
      (<Element><unknown>this.designItem.element).insertAdjacentElement('afterbegin', this.newItem.element);
    else {
      let el = (<Element><unknown>this.designItem.element).children[this.index - 1];
      if (this.newItem.nodeType == NodeType.Element)
        el.insertAdjacentElement('afterend', this.newItem.element);
      else if (this.newItem.nodeType == NodeType.TextNode) {
        el.insertAdjacentText('afterend', this.newItem.node.textContent);
      }
    }
  }

  public designItem: IDesignItem;
  public index: number;
  public newItem: IDesignItem;

  mergeWith(other: ITransactionItem) {
    return false
  }
}