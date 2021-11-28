import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { AbstractExtensionBase } from "./AbstractExtensionBase.js";

export abstract class AbstractExtension extends AbstractExtensionBase implements IDesignerExtension {
  protected extendedItem: IDesignItem;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView)
    this.extendedItem = extendedItem;
  }

  abstract extend();
  abstract refresh();
  abstract dispose();
}