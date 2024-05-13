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
  getUndoEntries(count?: number): Generator<string, void, unknown>;
  getRedoEntries(count?: number): Generator<string, void, unknown>;
  readonly undoCount: number;
  readonly redoCount: number;
}
