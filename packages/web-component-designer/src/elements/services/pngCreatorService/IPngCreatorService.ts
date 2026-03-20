import { IDesignItem } from "../../item/IDesignItem.js";

export interface IPngCreatorService {
    takePng(designItems: IDesignItem[], options?: { margin?: number, removeSelection?: boolean }): Promise<Uint8Array>
}