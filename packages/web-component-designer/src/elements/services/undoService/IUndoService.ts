import { IService } from '../IService.js';
import { ChangeGroup } from './ChangeGroup.js';
import { ITransactionItem } from './ITransactionItem.js';

export interface IUndoService extends IService {
  openGroup(title: string): ChangeGroup;
  execute(item: ITransactionItem): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clear();
  clearTransactionstackIfNotEmpty();
  undo();
  redo();
  redoTo(transactionItems: ITransactionItem[]);
  getUndoEntryNames(count?: number): Generator<string, void, unknown>;
  getUndoEntries(count?: number): Generator<ITransactionItem, void, unknown>;
  getRedoEntryNames(count?: number): Generator<string, void, unknown>;
  getRedoEntries(count?: number): Generator<ITransactionItem, void, unknown>;
  readonly undoCount: number;
  readonly redoCount: number;
}
