import { IDesignerExtensionProvider } from "../IDesignerExtensionProvider";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { IDesignerExtension } from "../IDesignerExtension";
import { IExtensionManager } from "../IExtensionManger";
import { LineExtension } from "./LineExtension";
import { isVisualSvgElement } from "../../../../helper/SvgHelper";

export class LineExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGLineElement) {
      return isVisualSvgElement(designItem.node);;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new LineExtension(extensionManager, designerView, designItem);
  }
}