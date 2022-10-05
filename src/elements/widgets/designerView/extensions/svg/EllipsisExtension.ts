import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { AbstractExtension } from "../AbstractExtension";
import { IExtensionManager } from "../IExtensionManger";


export class EllipsisExtension extends AbstractExtension {
    extend() {
        throw new Error("Method not implemented.");
    }
    refresh() {
        throw new Error("Method not implemented.");
    }
    dispose() {
        throw new Error("Method not implemented.");
    }
  
    constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
      super(extensionManager, designerView, extendedItem);
    }
}