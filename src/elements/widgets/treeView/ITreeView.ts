import { IDesignItem } from "../../item/IDesignItem";
import { ISelectionChangedEvent } from "../../services/selectionService/ISelectionChangedEvent";

//todo:
//buttons ins treeview so keyboard events could be directed to designer

export interface ITreeView {
  createTree(rootItem: IDesignItem);
  selectionChanged(event: ISelectionChangedEvent);
}