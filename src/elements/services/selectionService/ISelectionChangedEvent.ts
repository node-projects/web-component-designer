import { IDesignItem } from '../../item/IDesignItem';

export interface ISelectionChangedEvent {
    oldSelectedElements: IDesignItem[]
    selectedElements: IDesignItem[]
}