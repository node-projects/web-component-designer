import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PathExtension } from "./PathExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PathExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGPathElement ||
      designItem.node instanceof SVGRectElement ||
      designItem.node instanceof SVGCircleElement ||
      designItem.node instanceof SVGEllipseElement ||
      designItem.node instanceof SVGLineElement ||
      designItem.node instanceof SVGPolylineElement ||
      designItem.node instanceof SVGPolygonElement)
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new PathExtension(extensionManager, designerView, designItem);
  }
}