import { IDesignItem } from "../item/IDesignItem";

export interface ITreeView {
  createTree(rootItem: IDesignItem);
}