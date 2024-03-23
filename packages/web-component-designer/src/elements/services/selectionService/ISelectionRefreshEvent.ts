import { IDesignItem } from '../../item/IDesignItem.js';

export interface ISelectionRefreshEvent {
    selectedElements: IDesignItem[],
    event?: Event
}