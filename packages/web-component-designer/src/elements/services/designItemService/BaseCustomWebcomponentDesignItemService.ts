import { DesignItem } from "../../item/DesignItem.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { DesignItemService } from "./DesignItemService.js";

export class BaseCustomWebcomponentDesignItemService extends DesignItemService {
  override createDesignItem(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    const di = new DesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
    if (node instanceof (node.ownerDocument.defaultView ?? window).HTMLTemplateElement) {
      requestAnimationFrame(() => {
        let repeatCount = 1;
        const attr = node.getAttribute('sample-repeat-count');
        if (attr) {
          repeatCount = parseInt(attr);
        }
        for (let n = 0; n < repeatCount; n++) {
          let par: Element = node;
          for (const n of node.content.childNodes) {
            par = this.instancateNode(par, n);
          }
        }
      });
    }
    return di;
  }

  instancateNode(parent: Element, node: Node, append = false): Element {
    const nd = node.cloneNode(false);
    if (append)
      parent.appendChild(<Element>nd);
    else {
      parent.parentNode.insertBefore(nd, parent.nextSibling);
      //parent.insertAdjacentElement('afterend', <Element>nd);
    }
    DesignItem.GetDesignItem(node).setView(<Element>nd);
    for (const n of node.childNodes) {
      this.instancateNode(<Element>nd, n, true);
    }
    return <Element>nd;
  }
}