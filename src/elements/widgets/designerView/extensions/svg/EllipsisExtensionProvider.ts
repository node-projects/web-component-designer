import { IDesignerExtensionProvider } from "../IDesignerExtensionProvider";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { IDesignerExtension } from "../IDesignerExtension";
import { IExtensionManager } from "../IExtensionManger";
import { EllipsisExtension } from "./EllipsisExtension";

export class EllipsisExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGEllipseElement) {
      return true;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new EllipsisExtension(extensionManager, designerView, designItem);
  }
}