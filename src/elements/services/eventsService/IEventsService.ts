import { IDesignItem } from "../../item/IDesignItem.js";
import { IEvent } from "./IEvent.js";

export interface IEventsService {
    isHandledElement(designItem: IDesignItem): boolean;
    getPossibleEvents(designItem: IDesignItem): IEvent[];
}