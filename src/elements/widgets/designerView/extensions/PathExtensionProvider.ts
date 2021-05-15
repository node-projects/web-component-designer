import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PathExtension } from "./PathExtension";

export class PathExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean {
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

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new PathExtension(designerView, designItem);
  }
}