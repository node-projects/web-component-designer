import { IDesignItem } from '../../item/IDesignItem.js';

export interface ITransactionItem {
  title?: string
  readonly affectedItems?: IDesignItem[]
  do: () => void
  undo: () => void
  mergeWith(other: ITransactionItem): boolean;
  redoBranches?: ITransactionItem[][];
};