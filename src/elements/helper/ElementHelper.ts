export function newElementFromString(text): Element {
  const range = document.createRange();
  range.selectNode(document.body);
  const fragment = range.createContextualFragment(text);
  return fragment.firstChild as Element;
}

export enum ElementDisplayType {
  none,
  inline,
  block,
}

export function isInline(element: HTMLElement): boolean {
  return element != null && window.getComputedStyle(element).display.startsWith('inline');
}

export function getElementDisplaytype(element: HTMLElement): ElementDisplayType {
  const display = window.getComputedStyle(element).display;
  return display == 'none' ? ElementDisplayType.none : display.startsWith('inline') ? ElementDisplayType.inline : ElementDisplayType.block;
}

export function isEmptyTextNode(node: Node): boolean {
  return node.textContent.trim() == '' && node.textContent.indexOf('\xa0' /* &nbsp; */) < 0;
}

export function getActiveElement(): Element {
  let activeElement = document.activeElement;
  let lastActive = null;
  while (activeElement != lastActive) {
    lastActive = activeElement;
    if (activeElement.shadowRoot != null && activeElement.shadowRoot.activeElement)
      activeElement = activeElement.shadowRoot.activeElement;
  }
  return activeElement;
}