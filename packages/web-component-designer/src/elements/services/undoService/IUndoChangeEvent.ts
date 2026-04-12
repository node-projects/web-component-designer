import { ITransactionItem } from './ITransactionItem.js';

export type UndoChangeKind = 'execute' | 'undo' | 'redo';
export type UndoChangeSource = 'local' | 'remote';

export interface IUndoChangeEvent {
  item: ITransactionItem;
  kind: UndoChangeKind;
  source: UndoChangeSource;
}