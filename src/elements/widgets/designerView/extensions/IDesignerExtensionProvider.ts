import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";

export interface IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean;
  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension;
  style?: CSSStyleSheet;
}