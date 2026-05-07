import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ISelectionChangedEvent } from './ISelectionChangedEvent.js';
import { ISelectionRefreshEvent } from './ISelectionRefreshEvent.js';
import { ISourcePart } from '../sourceMapService/ISourcePart.js';

export interface ISelectionService {
  primarySelection: IDesignItem;
  selectedElements: IDesignItem[];
  selectedPart: ISourcePart;

  setSelectedElements(designItems: IDesignItem[], even?: Event, selectedPart?: ISourcePart): void;
  setSelectedPart(sourcePart: ISourcePart, event?: Event): void;
  setSelectionByTextRange(positionStart: number, positionEnd: number);

  clearSelectedElements(): void;

  isSelected(designItem: IDesignItem): boolean;

  readonly onSelectionChanged: TypedEvent<ISelectionChangedEvent>;
  readonly onSelectionRefresh: TypedEvent<ISelectionRefreshEvent>;
}
