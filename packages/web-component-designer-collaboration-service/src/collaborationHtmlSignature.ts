/** Compare authored HTML without treating attribute/CSS declaration ordering as a new edit. */
export function collaborationHtmlSignature(html: string): string {
  const root = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  const signature = (node: Node): unknown => {
    if (node.nodeType !== Node.ELEMENT_NODE) return [node.nodeType, node.textContent];
    const element = node as HTMLElement;
    const attributes = [...element.attributes].filter(attribute => attribute.name !== 'style')
      .map(attribute => [attribute.name, attribute.value]).sort(([a], [b]) => a.localeCompare(b));
    const styles = Array.from(element.style).sort().map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    const children = element.localName === 'template' && element.namespaceURI === 'http://www.w3.org/1999/xhtml'
      ? (element as HTMLTemplateElement).content.childNodes : node.childNodes;
    return [element.namespaceURI, element.localName, attributes, styles, [...children].map(signature)];
  };
  return JSON.stringify(signature(root));
}
