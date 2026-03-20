import { IDesignItem } from "../../item/IDesignItem.js";

export interface IPngCreatorService {
    takePng(designItems: IDesignItem[], margin: number): Promise<Uint8Array>;
}