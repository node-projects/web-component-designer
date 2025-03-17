import { DesignItem, hideAtDesignTimeAttributeName, hideAtRunTimeAttributeName, lockAtDesignTimeAttributeName } from "../../item/DesignItem.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { IDesignItemService } from "./IDesignItemService.js";

export class DesignItemService implements IDesignItemService {
  createDesignItem(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    return new DesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
  }

  handleSpecialAttributes(attributeName: string, designItem: IDesignItem) {
    if (attributeName == hideAtDesignTimeAttributeName) {
      if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
        if (!designItem.hasAttribute(hideAtDesignTimeAttributeName))
          designItem.element.style.display = <any>designItem.getStyle('display') ?? "";
        else
          designItem.element.style.display = 'none';
      }
    } else if (attributeName == hideAtRunTimeAttributeName) {
      if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
        if (!designItem.hasAttribute(hideAtRunTimeAttributeName))
          designItem.element.style.opacity = <any>designItem.getStyle('opacity') ?? "";
        else
          designItem.element.style.opacity = '0.3';
      }
    } else if (attributeName == lockAtDesignTimeAttributeName) {
      if (designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).HTMLElement || designItem.element instanceof (designItem.node.ownerDocument.defaultView ?? window).SVGElement) {
        if (!designItem.hasAttribute(lockAtDesignTimeAttributeName))
          designItem.element.style.pointerEvents = 'auto';
        else
          designItem.element.style.pointerEvents = 'none';
      }
    }
  }
}