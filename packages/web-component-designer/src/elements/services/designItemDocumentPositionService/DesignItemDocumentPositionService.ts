import { IDesignItem } from "../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IStringPosition } from "../htmlWriterService/IStringPosition.js";
import { ISourcePart } from "../sourceMapService/ISourcePart.js";
import { IDesignItemDocumentPositionService } from "./IDesignItemDocumentPositionService.js";

export class DesignItemDocumentPositionService implements IDesignItemDocumentPositionService {

    private _designItemsAssignmentList?: WeakMap<IDesignItem, IStringPosition> = new WeakMap();
    private _sourceParts: ISourcePart[] = [];
    private _sourcePartsByDesignItem: WeakMap<IDesignItem, ISourcePart[]> = new WeakMap();
    private _sourcePartsByDesignItemAndKey: WeakMap<IDesignItem, Map<string, ISourcePart>> = new WeakMap();

    constructor(designerCanvas: IDesignerCanvas) { }

    setPosition(designItem: IDesignItem, position: IStringPosition) {
        this._designItemsAssignmentList.set(designItem, position);
    }

    getPosition(designItem: IDesignItem): IStringPosition {
        return this._designItemsAssignmentList.get(designItem);
    }

    clearSourceParts(): void {
        this._sourceParts = [];
        this._sourcePartsByDesignItem = new WeakMap();
        this._sourcePartsByDesignItemAndKey = new WeakMap();
    }

    addSourcePart(sourcePart: ISourcePart): void {
        if (!sourcePart?.designItem || !sourcePart.textRange)
            return;

        this._sourceParts.push(sourcePart);

        let sourceParts = this._sourcePartsByDesignItem.get(sourcePart.designItem);
        if (!sourceParts) {
            sourceParts = [];
            this._sourcePartsByDesignItem.set(sourcePart.designItem, sourceParts);
        }
        sourceParts.push(sourcePart);

        let sourcePartsByKey = this._sourcePartsByDesignItemAndKey.get(sourcePart.designItem);
        if (!sourcePartsByKey) {
            sourcePartsByKey = new Map();
            this._sourcePartsByDesignItemAndKey.set(sourcePart.designItem, sourcePartsByKey);
        }
        sourcePartsByKey.set(sourcePart.key, sourcePart);
    }

    addSourceParts(sourceParts: ISourcePart[]): void {
        for (const sourcePart of sourceParts ?? [])
            this.addSourcePart(sourcePart);
    }

    getSourcePartAt(position: number): ISourcePart {
        let bestPart: ISourcePart = null;
        for (const sourcePart of this._sourceParts) {
            const start = sourcePart.textRange.start;
            const end = start + sourcePart.textRange.length;
            if (start <= position && end >= position) {
                if (!bestPart || sourcePart.textRange.length <= bestPart.textRange.length)
                    bestPart = sourcePart;
            }
        }
        return bestPart;
    }

    getSourceParts(designItem: IDesignItem): ISourcePart[] {
        return this._sourcePartsByDesignItem.get(designItem) ?? [];
    }

    getSourcePartPosition(designItem: IDesignItem, key: string): IStringPosition {
        return this._sourcePartsByDesignItemAndKey.get(designItem)?.get(key)?.textRange;
    }
}
