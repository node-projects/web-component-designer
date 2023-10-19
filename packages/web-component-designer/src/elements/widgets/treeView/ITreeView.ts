import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent.js';

//TODO: buttons in treeview so keyboard events could be directed to designer

export interface ITreeView {
  createTree(rootItem: IDesignItem);
  selectionChanged(event: ISelectionChangedEvent);
}