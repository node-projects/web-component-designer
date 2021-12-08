import { ITransactionItem } from './ITransactionItem.js';
import { ChangeGroup } from "./ChangeGroup.js";
import { IUndoService } from './IUndoService.js';
import { IDesignItem } from '../../item/IDesignItem';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';

/*
 * Manages a stack of available undo/redo actions
 */
export class UndoService implements IUndoService {
  private _undoStack: ITransactionItem[] = [];
  private _redoStack: ITransactionItem[] = [];
  private _transactionStack: ChangeGroup[] = [];
  private _designerCanvas: IDesignerCanvas;

  constructor(designerCanvas?: IDesignerCanvas) {
    this._designerCanvas = designerCanvas;
  }

  openGroup(title: string, affectedItems: IDesignItem[]): ChangeGroup {
    let t = new ChangeGroup(title, affectedItems, (t) => this.commitTransactionItem(t), (t) => this.abortTransactionItem(t));
    this._transactionStack.push(t);
    return t;
  }

  private commitTransactionItem(transactionItem: ITransactionItem) {
    let itm = this._transactionStack.pop();
    if (itm !== transactionItem) {
      this.clear();
      throw "UndoService - Commited Transation was not the last";
    }
    if (itm.undoStack.length)
      this._undoStack.push(itm);
  }

  private abortTransactionItem(transactionItem: ITransactionItem) {
    let itm = this._transactionStack.pop();
    if (itm !== transactionItem) {
      this.clear();
      throw "UndoService - Aborted Transation was not the last";
    }
    itm.undo();
  }

  execute(item: ITransactionItem) {
    if (this._transactionStack.length == 0) {
      item.do();
      this._undoStack.push(item);
      this._redoStack = []
    } else {
      this._transactionStack[this._transactionStack.length - 1].execute(item);
    }
    this._designerCanvas.extensionManager.refreshAllExtensions(item.affectedItems);
    this._designerCanvas.onContentChanged.emit();
  }

  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._transactionStack = [];
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
    this._designerCanvas.extensionManager.refreshAllExtensions(item.affectedItems);
    this._designerCanvas.onContentChanged.emit();
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
    this._designerCanvas.extensionManager.refreshAllExtensions(item.affectedItems);
    this._designerCanvas.onContentChanged.emit();
  }

  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }
}
