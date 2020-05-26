import { IService } from '../IService';
import { ChangeGroup } from './ChangeGroup';
import { ITransactionItem } from './ITransactionItem';
import { IDesignItem } from '../../item/IDesignItem';

export interface IUndoService extends IService {
  openGroup(title: string, affectedItems?: IDesignItem[]): ChangeGroup
  execute(item: ITransactionItem) :void
}
