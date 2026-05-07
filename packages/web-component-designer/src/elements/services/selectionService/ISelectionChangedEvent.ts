import { IDesignItem } from '../../item/IDesignItem.js';
import { ISourcePart } from '../sourceMapService/ISourcePart.js';

export interface ISelectionChangedEvent {
    oldSelectedElements: IDesignItem[]
    selectedElements: IDesignItem[],
    selectedPart?: ISourcePart,
    oldSelectedPart?: ISourcePart,
    event?: Event
}
