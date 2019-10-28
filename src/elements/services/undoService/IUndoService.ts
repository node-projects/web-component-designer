import { UndoItemType } from "./UndoItemType";
import { IUndoItem } from './IUndoItem';
import { ChangeGroup } from "./ChangeGroup";

export interface IUndoService {
  undoHistory: IUndoItem[]
  redoHistory: IUndoItem[]
  createChangeGroup(): ChangeGroup
  add(action: UndoItemType, node, detail?)
  undo() 
  redo() 
  updateButtons()
}
