import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { SvgExtension } from "./SvgExtension";
import { IExtensionManager } from "./IExtensionManger";

export class SvgExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGPathElement ||
      designItem.node instanceof SVGRectElement ||
      designItem.node instanceof SVGCircleElement ||
      designItem.node instanceof SVGEllipseElement ||
      designItem.node instanceof SVGLineElement ||
      designItem.node instanceof SVGPolylineElement ||
      designItem.node instanceof SVGPolygonElement) {
      return true;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new SvgExtension(extensionManager, designerView, designItem);
  }
}