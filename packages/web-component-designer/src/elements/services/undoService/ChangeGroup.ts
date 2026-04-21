import { ITransactionItem } from './ITransactionItem.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { UndoChangeSource } from './IUndoChangeEvent.js';
import { IContentChanged } from '../InstanceServiceContainer.js';

export class ChangeGroup implements ITransactionItem {

  redoBranches?: ITransactionItem[][];
  source: UndoChangeSource;
  private _contentChanges: IContentChanged[] = [];

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
  private commitHandler: (transactionItem: ChangeGroup) => void;
  private abortHandler: (transactionItem: ChangeGroup) => void;

  constructor(title: string, commitHandler: (transactionItem: ChangeGroup) => void, abortHandler: (transactionItem: ChangeGroup) => void, source: UndoChangeSource = 'local') {
    this.title = title;
    this.commitHandler = commitHandler;
    this.abortHandler = abortHandler;
    this.source = source;
  }

  get contentChanges(): IContentChanged[] | null {
    return this._contentChanges.length > 0 ? this._contentChanges : null;
  }

  do(): IContentChanged[] | null {
    let item: ITransactionItem = null;
    let changes: IContentChanged[] = [];
    while (item = this.redoStack.pop()) {
      try {
        let result = item.do();
        if (result) {
          changes.push(...result);
        }
        this.undoStack.push(item);
      } catch (err) {
        throw err;
      }
    }
    return changes.length > 0 ? changes : null;

  }

  undo(): IContentChanged[] | null {
    let item: ITransactionItem = null;
    let changes: IContentChanged[] = [];
    while (item = this.undoStack.pop()) {
      try {
        let result = item.undo();
        if (result) {
          changes.push(...result);
        }
        this.redoStack.push(item);
      } catch (err) {
        throw err;
      }
    }
    return changes.length > 0 ? changes : null;
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
    this._recordContentChanges(changeGroup.contentChanges);
  }

  public undoStack: ITransactionItem[] = []
  public redoStack: ITransactionItem[] = []

  public execute(item: ITransactionItem): IContentChanged[] | null {
    let changes: IContentChanged[] | null = item.do();
    this._recordContentChanges(changes);

    for (let existingItem of this.undoStack) {
      if (existingItem.mergeWith(item))
        return changes;
    }

    this.undoStack.push(item);
    return changes;
  }

  private _recordContentChanges(changes: IContentChanged[] | null) {
    if (changes?.length)
      this._contentChanges.push(...changes);
  }
}