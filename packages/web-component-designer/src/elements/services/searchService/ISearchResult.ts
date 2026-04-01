import { IDesignItem } from "../../item/IDesignItem.js";

// This class could later wrap, how it was found by the search, for example which property matched, etc. For now it only contains the design item itself.

export interface ISearchResult {
    designItem: IDesignItem;
}