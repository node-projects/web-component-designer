import { IDesignItem } from "../../item/IDesignItem.js"
import { IStringPosition } from "../htmlWriterService/IStringPosition.js"

export interface IDesignItemDocumentPositionService {
    setPosition(designItem: IDesignItem, position: IStringPosition)
    getPosition(designItem: IDesignItem): IStringPosition
}