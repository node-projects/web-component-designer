import { UndoItemType } from "./UndoItemType";
import { IUndoItem } from './IUndoItem';
import { ChangeGroup } from "./ChangeGroup";
import { IService } from '../IService';

export interface IUndoService extends IService {
  undoHistory: IUndoItem[]
  redoHistory: IUndoItem[]
  createChangeGroup(): ChangeGroup
  add(action: UndoItemType, node, detail?)
  undo() 
  redo() 
  updateButtons()
}
