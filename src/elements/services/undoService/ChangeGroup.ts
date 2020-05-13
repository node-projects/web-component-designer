import { ITransactionItem } from './ITransactionItem';
import { IDesignItem } from '../../item/IDesignItem';

export class ChangeGroup implements ITransactionItem {

  constructor(title: string, affectedItems: IDesignItem[]) {
    this.title = title;
    this.affectedItems = affectedItems;
  }

  title: string;
  affectedItems: IDesignItem[];

  commit() {
  }

  abort() {
  }

  do: () => void;
  undo: () => void;

  mergeWith(other: ITransactionItem): boolean {
    return false;
  }

  public items: ITransactionItem[]

  public execute(item: ITransactionItem) {
    item.do();

    for (let existingItem of this.items) {
      if (existingItem.mergeWith(item))
        return;
    }

    this.items.push(item);
  }
}