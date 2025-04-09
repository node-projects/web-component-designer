import { IDesignItem } from "../../item/IDesignItem.js";

export interface IDeletionService {
  removeItems(items: IDesignItem[]);
}