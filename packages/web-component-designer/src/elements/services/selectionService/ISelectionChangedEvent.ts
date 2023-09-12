import { IDesignItem } from '../../item/IDesignItem.js';

export interface ISelectionChangedEvent {
    oldSelectedElements: IDesignItem[]
    selectedElements: IDesignItem[]
}