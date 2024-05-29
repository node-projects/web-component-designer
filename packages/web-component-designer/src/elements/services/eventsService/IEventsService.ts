import { IDesignItem } from "../../item/IDesignItem.js";
import { IEvent } from "./IEvent.js";

export interface IEventsService {
    isHandledElementFromEventsService(designItem: IDesignItem): boolean;
    getPossibleEvents(designItem: IDesignItem): IEvent[];
    getEvent(designItem: IDesignItem, name: string): IEvent;
}