import { IDesignItem } from "../../item/IDesignItem";

export interface ITransactionItem {
  title?: string
  readonly affectedItems?: IDesignItem[]
  do: () => void
  undo: () => void
  mergeWith(other: ITransactionItem): boolean;
};