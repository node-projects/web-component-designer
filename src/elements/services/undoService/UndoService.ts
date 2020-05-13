import { ITransactionItem } from './ITransactionItem.js';
import { ChangeGroup } from "./ChangeGroup.js";
import { IUndoService } from './IUndoService.js';
import { IDesignItem } from '../../item/IDesignItem';

/*
 * Manages a stack of available undo/redo actions
 */
export class UndoService implements IUndoService {
  private _undoStack: ITransactionItem[] = [];
  private _redoStack: ITransactionItem[] = [];
  private _transactionStack: ChangeGroup[] = [];

  openGroup(title: string, affectedItems: IDesignItem[]): ChangeGroup {
    let t = new ChangeGroup(title, affectedItems);
    this._transactionStack.push(t);
    return t;
  }

  execute(item: ITransactionItem) {
    if (this._transactionStack.length == 0) {
      item.do();
      this._undoStack.push(item);
      this._redoStack = []
    } else {
      this._transactionStack[this._transactionStack.length - 1].execute(item);
    }
  }

  clear() {
    this._undoStack = [];
    this._redoStack = [];
  }

  undo() {
    if (!this.canUndo())
      return;
    if (this._transactionStack.length != 0)
      throw "Cannot Undo while transaction is running";

    let item = this._undoStack.pop();
    try {
      item.undo();
      this._redoStack.push(item);
    } catch (err) {
      this.clear();
      throw err;
    }
  }

  redo() {
    if (!this.canRedo())
      return;
    if (this._transactionStack.length != 0)
      throw "Cannot Redo while transaction is running";

    let item = this._redoStack.pop();
    try {
      item.do();
      this._undoStack.push(item);
    } catch (err) {
      this.clear();
      throw err;
    }
  }

  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }
}
