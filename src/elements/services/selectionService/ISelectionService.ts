import { IDesignItem } from '../../item/IDesignItem';
import { TypedEvent } from '../../../basic/TypedEvent';
import { ISelectionChangedEvent } from './ISelectionChangedEvent';

export interface ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[];

  setSelectedElements(designItems: IDesignItem[]): void;

  isSelected(designItem: IDesignItem): boolean;

  readonly onSelectionChanged: TypedEvent<ISelectionChangedEvent>;
}