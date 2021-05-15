import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { TransformOriginExtension } from "./TransformOriginExtension";

export class TransformOriginExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new TransformOriginExtension(designerView, designItem);
  }
}