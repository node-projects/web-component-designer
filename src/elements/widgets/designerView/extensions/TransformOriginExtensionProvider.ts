import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { TransformOriginExtension } from "./TransformOriginExtension";
import { IExtensionManager } from "./IExtensionManger";

export class TransformOriginExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new TransformOriginExtension(extensionManager, designerView, designItem);
  }
}