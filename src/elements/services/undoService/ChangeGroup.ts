import { ITransactionItem } from './ITransactionItem';
import { IDesignItem } from '../../../../dist/elements/item/IDesignItem';

export class ChangeGroup implements ITransactionItem {

  constructor(title?: string) {
    this.title = title;
  }

  title?: string;
  affectedItems?: IDesignItem[];

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