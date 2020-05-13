import { IDesignItem } from '../../item/IDesignItem';

export interface ITreeStructureChangedEvent {
  action: 'add' | 'move' | 'remove' | 'replace' | 'reset'
  newItems?: IDesignItem[]
  newStartingIndex?: number
  oldItems?: IDesignItem[]
  oldStartingIndex?: number
}