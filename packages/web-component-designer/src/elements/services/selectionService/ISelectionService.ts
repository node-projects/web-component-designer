import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';

export interface ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[];

  setSelectedElements(designItems: IDesignItem[]): void;
  setSelectionByTextRange(positionStart: number, positionEnd: number);

  clearSelectedElements(): void;

  isSelected(designItem: IDesignItem): boolean;

  readonly onSelectionChanged: TypedEvent<ISelectionChangedEvent>;
}