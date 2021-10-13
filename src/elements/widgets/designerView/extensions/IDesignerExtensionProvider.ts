import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";

export interface IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean;
  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem) : IDesignerExtension;
  style? : CSSStyleSheet;
}