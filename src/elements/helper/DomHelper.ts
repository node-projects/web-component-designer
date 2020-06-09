export class DomHelper {

  static * getAllChildNodes(element: ParentNode, includeShadowDom = false): IterableIterator<Node> {
    if (element.children) {
      for (const node of element.children) {
        yield node;
        if (includeShadowDom && node.shadowRoot != null) {
          yield node.shadowRoot;
          const childs = DomHelper.getAllChildNodes(node.shadowRoot, includeShadowDom);
          for (const cnode of childs) {
            yield cnode;
          }
        }
        const childs = DomHelper.getAllChildNodes(node, includeShadowDom);
        for (const cnode of childs) {
          yield cnode;
        }
      }
    }
    if (includeShadowDom && (<any>element).shadowRoot != null) {
      yield (<any>element).shadowRoot;
      const childs = DomHelper.getAllChildNodes((<any>element).shadowRoot, includeShadowDom);
      for (const cnode of childs) {
        yield cnode;
      }
    }
    return null;
  }

  static removeAllChildnodes(node: Element) {
    for (let c = node.firstChild; c !== null; c = node.firstChild) {
      node.removeChild(c);
    }
  }

  static getAbsoluteBoundingRect(node: Node, relativeTo?: Node) {
    let rect = { x: 0, y: 0, unscaledX: 0, unscaledY: 0 };
    let currentNode = node;
    while (currentNode) {
      let st = window.getComputedStyle(<Element>currentNode);
      //@ts-ignore
      rect.x = currentNode.offsetLeft + rect.x * st.zoom;
      //@ts-ignore
      rect.x = currentNode.offsetTop + rect.y * st.zoom;
      //@ts-ignore
      rect.unscaledX += currentNode.offsetLeft;
      //@ts-ignore
      rect.unscaledY += currentNode.offsetTop;
      //@ts-ignore
      currentNode = currentNode.offsetParent;
      if (currentNode == relativeTo)
        break;
    }
    return rect;
  }
}