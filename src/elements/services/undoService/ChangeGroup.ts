import { ITransactionItem } from './ITransactionItem';
import { IDesignItem } from '../../item/IDesignItem';

export class ChangeGroup implements ITransactionItem {

  title: string;
  affectedItems: IDesignItem[];
  private commitHandler: (transactionItem: ITransactionItem) => void;
  private abortHandler: (transactionItem: ITransactionItem) => void;

  constructor(title: string, affectedItems: IDesignItem[], commitHandler: (transactionItem: ITransactionItem) => void, abortHandler: (transactionItem: ITransactionItem) => void) {
    this.title = title;
    this.affectedItems = affectedItems;
    this.commitHandler = commitHandler;
    this.abortHandler = abortHandler;
  }

  do() {
    let item = this.undoStack.pop();
    try {
      item.do();
      this.undoStack.push(item);
    } catch (err) {
      throw err;
    }
  }

  undo() {
    let item = this.undoStack.pop();
    try {
      item.undo();
      this.redoStack.push(item);
    } catch (err) {
      throw err;
    }

  };

  commit() {
    this.commitHandler(this);
  }

  abort() {
    this.abortHandler(this);
  }

  mergeWith(other: ITransactionItem): boolean {
    return false;
  }

  public undoStack: ITransactionItem[] = []
  public redoStack: ITransactionItem[] = []

  public execute(item: ITransactionItem) {
    item.do();

    for (let existingItem of this.undoStack) {
      if (existingItem.mergeWith(item))
        return;
    }

    this.undoStack.push(item);
  }
}