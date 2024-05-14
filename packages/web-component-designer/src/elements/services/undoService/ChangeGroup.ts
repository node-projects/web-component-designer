import { ITransactionItem } from './ITransactionItem.js';
import { IDesignItem } from '../../item/IDesignItem.js';

export class ChangeGroup implements ITransactionItem {

  redoBranches?: ITransactionItem[][];
  
  title: string;
  get affectedItems(): IDesignItem[] {
    let s = new Set<IDesignItem>();
    for (let u of this.undoStack)
      for (let i of u.affectedItems)
        s.add(i);
    for (let u of this.redoStack)
      for (let i of u.affectedItems)
        s.add(i);
    return [...s.values()]
  }
  private commitHandler: (transactionItem: ITransactionItem) => void;
  private abortHandler: (transactionItem: ITransactionItem) => void;

  constructor(title: string, commitHandler: (transactionItem: ITransactionItem) => void, abortHandler: (transactionItem: ITransactionItem) => void) {
    this.title = title;
    this.commitHandler = commitHandler;
    this.abortHandler = abortHandler;
  }

  do() {
    let item: ITransactionItem = null;
    while (item = this.redoStack.pop()) {
      try {
        item.do();
        this.undoStack.push(item);
      } catch (err) {
        throw err;
      }
    }
  }

  undo() {
    let item: ITransactionItem = null;
    while (item = this.undoStack.pop()) {
      try {
        item.undo();
        this.redoStack.push(item);
      } catch (err) {
        throw err;
      }
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

  addCommitedSubchangeGroup(changeGroup: ChangeGroup) {
    this.undoStack.push(changeGroup);
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