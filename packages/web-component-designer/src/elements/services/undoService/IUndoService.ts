import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IService } from '../IService.js';
import { ChangeGroup } from './ChangeGroup.js';
import { IUndoChangeEvent, UndoChangeSource } from './IUndoChangeEvent.js';
import { ITransactionItem } from './ITransactionItem.js';

export interface IUndoService extends IService {
  openGroup(title: string, source?: UndoChangeSource): ChangeGroup;
  execute(item: ITransactionItem, source?: UndoChangeSource): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clear();
  clearTransactionstackIfNotEmpty();
  undo(source?: UndoChangeSource);
  redo(source?: UndoChangeSource);
  redoTo(transactionItems: ITransactionItem[]);
  getUndoEntryNames(count?: number): Generator<string, void, unknown>;
  getUndoEntries(count?: number): Generator<ITransactionItem, void, unknown>;
  getRedoEntryNames(count?: number): Generator<string, void, unknown>;
  getRedoEntries(count?: number): Generator<ITransactionItem, void, unknown>;
  readonly undoCount: number;
  readonly redoCount: number;
  readonly onTransaction: TypedEvent<IUndoChangeEvent>;
}
