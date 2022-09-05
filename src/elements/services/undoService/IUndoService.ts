import { IService } from '../IService';
import { ChangeGroup } from './ChangeGroup';
import { ITransactionItem } from './ITransactionItem';

export interface IUndoService extends IService {
  openGroup(title: string): ChangeGroup
  execute(item: ITransactionItem): void
  canUndo(): boolean;
  canRedo(): boolean;
  clear();
  undo();
  redo();
}
