import { IDesignItem } from "../../item/IDesignItem";
import { ISelectionChangedEvent } from "../../services/selectionService/ISelectionChangedEvent";

export interface ITreeView {
  createTree(rootItem: IDesignItem);
  selectionChanged(event: ISelectionChangedEvent);
}