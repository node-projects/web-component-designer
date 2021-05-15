import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";

export interface IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean;
  getExtension(designerView: IDesignerView, designItem: IDesignItem) : IDesignerExtension
}