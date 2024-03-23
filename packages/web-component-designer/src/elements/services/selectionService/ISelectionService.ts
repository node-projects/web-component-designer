import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';
import { ISelectionRefreshEvent } from './ISelectionRefreshEvent.js';

export interface ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[];

  setSelectedElements(designItems: IDesignItem[], even?: Event): void;
  setSelectionByTextRange(positionStart: number, positionEnd: number);

  clearSelectedElements(): void;

  isSelected(designItem: IDesignItem): boolean;

  readonly onSelectionChanged: TypedEvent<ISelectionChangedEvent>;
  readonly onSelectionRefresh: TypedEvent<ISelectionRefreshEvent>;
}