import { IDesignItem } from "../../item/IDesignItem.js"
import { IStringPosition } from "../htmlWriterService/IStringPosition.js"
import { ISourcePart } from "../sourceMapService/ISourcePart.js"

export interface IDesignItemDocumentPositionService {
    setPosition(designItem: IDesignItem, position: IStringPosition)
    getPosition(designItem: IDesignItem): IStringPosition
    clearSourceParts(): void
    addSourcePart(sourcePart: ISourcePart): void
    addSourceParts(sourceParts: ISourcePart[]): void
    getSourcePartAt(position: number): ISourcePart
    getSourceParts(designItem: IDesignItem): ISourcePart[]
    getSourcePartPosition(designItem: IDesignItem, key: string): IStringPosition
}
