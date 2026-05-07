import { IDesignItem } from '../../item/IDesignItem.js';
import { ISourcePart } from '../sourceMapService/ISourcePart.js';

export interface ISelectionRefreshEvent {
    selectedElements: IDesignItem[],
    selectedPart?: ISourcePart,
    event?: Event
}
