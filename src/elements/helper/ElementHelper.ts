export function newElementFromString(text): Element {
  const range = document.createRange();
  range.selectNode(document.body);
  const fragment = range.createContextualFragment(text);
  return fragment.firstChild as Element;
}

export function isInline(element: HTMLElement): boolean {
  return element != null && window.getComputedStyle(element).display.startsWith('inline');
}