/** Three-way merge for independent canvas edits. The incoming (local) edit wins overlapping changes. */
export function mergeCollaborationHtml(base: string, local: string, remote: string): string {
  if (local === base || local === remote) return remote;
  if (remote === base) return local;
  type Tree = { tag?: string; text?: string; attributes?: Record<string, string>; style?: Record<string, string>; order?: string[]; children?: Record<string, Tree> };
  const parse = (html: string) => {
    const root = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
    const tree = (node: Node): Tree => {
      if (node.nodeType !== Node.ELEMENT_NODE) return { tag: node.nodeType === Node.COMMENT_NODE ? '#comment' : '#text', text: node.textContent ?? '' };
      const element = node as HTMLElement;
      const attributes = Object.fromEntries([...element.attributes].filter(a => a.name !== 'style').map(a => [a.name, a.value]));
      const style = Object.fromEntries(Array.from(element.style).map(name => [name, element.style.getPropertyValue(name) + (element.style.getPropertyPriority(name) ? ' !important' : '')]));
      const children: Record<string, Tree> = Object.create(null);
      const childNodes = element.localName === 'template' && element.namespaceURI === 'http://www.w3.org/1999/xhtml'
        ? (element as HTMLTemplateElement).content.childNodes : node.childNodes;
      const nodes = [...childNodes];
      const counts = new Map<string, number>();
      for (const child of nodes) if (child instanceof Element && child.id) counts.set(child.id, (counts.get(child.id) ?? 0) + 1);
      const order = nodes.map((child, index) => {
        const key = child instanceof Element && child.id && counts.get(child.id) === 1 ? 'id:' + child.id : 'index:' + index + ':' + child.nodeName;
        children[key] = tree(child);
        return key;
      });
      return { tag: element.localName, attributes, style, order, children };
    };
    return tree(root);
  };
  const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const merge = (b: any, l: any, r: any, path: string): any => {
    if (equal(l, b) || equal(l, r)) return r;
    if (equal(r, b)) return l;
    if (path.endsWith('/order') && [b, l, r].every(Array.isArray))
      return [...l, ...r.filter((key: string) => !b.includes(key) && !l.includes(key))];
    if (b && l && r && typeof b === 'object' && typeof l === 'object' && typeof r === 'object' && !Array.isArray(b) && !Array.isArray(l) && !Array.isArray(r)) {
      const result = Object.create(null);
      for (const key of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
        const value = merge(b[key], l[key], r[key], path + '/' + key);
        if (value !== undefined) result[key] = value;
      }
      if (result.order && result.children) {
        result.order = result.order.filter((key: string) => result.children[key]);
        // An incoming edit to a previously deleted node wins that delete/edit overlap.
        for (const key of l.order ?? []) if (!result.order.includes(key) && result.children[key]) {
          const previous = l.order.slice(0, l.order.indexOf(key)).reverse().find((candidate: string) => result.order.includes(candidate));
          result.order.splice(previous ? result.order.indexOf(previous) + 1 : 0, 0, key);
        }
      }
      return result;
    }
    return l;
  };
  const result = merge(parse(base), parse(local), parse(remote), 'canvas') as Tree;
  const render = (value: Tree, owner: Document, namespace?: string): Node => {
    if (value.tag === '#text') return owner.createTextNode(value.text ?? '');
    if (value.tag === '#comment') return owner.createComment(value.text ?? '');
    const ns = value.tag === 'svg' ? 'http://www.w3.org/2000/svg' : namespace;
    const element = ns ? owner.createElementNS(ns, value.tag) as HTMLElement : owner.createElement(value.tag);
    for (const [name, text] of Object.entries(value.attributes ?? {})) element.setAttribute(name, text);
    for (const [name, text] of Object.entries(value.style ?? {}))
      element.style.setProperty(name, text.replace(/ !important$/, ''), text.endsWith(' !important') ? 'important' : '');
    for (const key of value.order ?? []) {
      const parent = value.tag === 'template' && !ns ? (element as HTMLTemplateElement).content : element;
      if (value.children?.[key]) parent.appendChild(render(value.children[key], owner, value.tag === 'foreignObject' ? undefined : ns));
    }
    return element;
  };
  return (render(result, document.implementation.createHTMLDocument()) as HTMLElement).innerHTML;
}
