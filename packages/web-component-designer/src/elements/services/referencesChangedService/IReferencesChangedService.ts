import { IDesignItem } from "../../item/IDesignItem.js";

type idChange = { designItem: IDesignItem, oldValue: string, type: 'idChanged' };
type deleted = { designItem: IDesignItem, type: 'deleted' };

export interface IReferencesChangedService {
    notifyReferencesChanged(changes: (idChange | deleted)[]): void;
}