import { IDesignItem } from '../../item/IDesignItem.js';
import { IContentChanged } from '../InstanceServiceContainer.js';

export interface ITransactionItem {
  title?: string
  readonly affectedItems?: IDesignItem[]
  do: () => IContentChanged[] | null
  undo: () => IContentChanged[] | null
  mergeWith(other: ITransactionItem): boolean;
  redoBranches?: ITransactionItem[][];
};