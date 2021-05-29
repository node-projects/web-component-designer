import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PrimarySelectionDefaultExtension } from "./PrimarySelectionDefaultExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PrimarySelectionDefaultExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new PrimarySelectionDefaultExtension(extensionManager, designerView, designItem);
  }
}