import { IDesignerExtensionProvider } from "../IDesignerExtensionProvider";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { IDesignerExtension } from "../IDesignerExtension";
import { IExtensionManager } from "../IExtensionManger";
import { LineExtension } from "./LineExtension";

export class LineExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGLineElement) {
      return true;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new LineExtension(extensionManager, designerView, designItem);
  }
}