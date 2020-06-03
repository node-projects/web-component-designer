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
}