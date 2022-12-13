import { IPoint } from "../../interfaces/IPoint";

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
  if (element instanceof SVGElement)
    return false;
  return element != null && window.getComputedStyle(element).display.startsWith('inline');
}

export function isInlineAfter(element: HTMLElement): boolean {
  if (element instanceof SVGElement)
    return false;
  return element != null && window.getComputedStyle(element).display.startsWith('inline');
}

export function getElementDisplaytype(element: HTMLElement): ElementDisplayType {
  if (element instanceof SVGElement)
    return ElementDisplayType.block;
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

export function getParentElementIncludingSlots(element: Element): Element {
  if (element.assignedSlot)
    return element.assignedSlot;
  if (element.parentElement == null) {
    if (element.parentNode instanceof ShadowRoot) {
      return element.parentNode.host;
    }
  }
  return element.parentElement;
}

export function getElementsWindowOffsetWithoutSelfAndParentTransformations(element) {
  let offsetLeft = 0;
  let offsetTop = 0;

  while (element) {
    if (element instanceof SVGSVGElement) {
      //todo - fix without transformation
      let t = element.style.transform;
      element.style.transform = '';
      const bcEl = element.getBoundingClientRect();
      const bcPar = element.parentElement.getBoundingClientRect();
      element.style.transform = t;
      offsetLeft += bcEl.left - bcPar.left;
      offsetTop += bcEl.top - bcPar.top;
      element = element.parentElement;
    } else if (element instanceof SVGGraphicsElement) {
      let bbox = element.getBBox();
      offsetLeft += bbox.x;
      offsetTop += bbox.y;
      element = element.ownerSVGElement;
     } else if (element instanceof HTMLBodyElement) {
        let bbox = element.getBoundingClientRect();
        offsetLeft += bbox.x;
        offsetTop += bbox.y;
        element = element.offsetParent; 
    } else {
      offsetLeft += element.offsetLeft;
      offsetTop += element.offsetTop;
      element = element.offsetParent;
    }
  }
  return { offsetLeft: offsetLeft, offsetTop: offsetTop };
}

export function getContentBoxContentOffsets(element): IPoint {
    let xOffset = parseInt(getComputedStyle(element).paddingLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).marginLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).borderLeft.replace('px', ''))
      + parseInt(getComputedStyle(element).paddingRight.replace('px', ''))
      + parseInt(getComputedStyle(element).marginRight.replace('px', ''))
      + parseInt(getComputedStyle(element).borderRight.replace('px', ''));

    let yOffset = parseInt(getComputedStyle(element).paddingTop.replace('px', ''))
      + parseInt(getComputedStyle(element).marginTop.replace('px', ''))
      + parseInt(getComputedStyle(element).borderTop.replace('px', ''))
      + parseInt(getComputedStyle(element).paddingBottom.replace('px', ''))
      + parseInt(getComputedStyle(element).marginBottom.replace('px', ''))
      + parseInt(getComputedStyle(element).borderBottom.replace('px', ''));

      return {x: xOffset, y: yOffset};
}