import { IDesignItem } from "../../item/IDesignItem.js";

export interface IContentChanged {
    changeType: "added" | "removed" | "moved" | 'parsed'
    designItems?: IDesignItem[];
}