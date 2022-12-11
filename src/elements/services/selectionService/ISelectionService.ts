import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';

export interface ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[];

  setSelectedElements(designItems: IDesignItem[]): void;

  clearSelectedElements(): void;

  isSelected(designItem: IDesignItem): boolean;

  readonly onSelectionChanged: TypedEvent<ISelectionChangedEvent>;
}