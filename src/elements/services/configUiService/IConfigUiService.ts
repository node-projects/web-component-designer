import { IDesignItem } from "../../item/IDesignItem.js";

export interface IConfigUiService {
    hasConfigUi(designItem: IDesignItem): Promise<boolean>
    getConfigUi(designItem: IDesignItem): Promise<HTMLElement>
}