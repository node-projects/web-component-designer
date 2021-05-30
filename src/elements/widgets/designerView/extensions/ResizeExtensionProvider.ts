import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { ResizeExtension } from "./ResizeExtension";
import { IExtensionManager } from "./IExtensionManger";

export class ResizeExtensionProvider implements IDesignerExtensionProvider {
  private resizeAllSelected: boolean;

  constructor(resizeAllSelected: boolean = false) {
    this.resizeAllSelected = resizeAllSelected;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new ResizeExtension(extensionManager, designerView, designItem, this.resizeAllSelected);
  }
}