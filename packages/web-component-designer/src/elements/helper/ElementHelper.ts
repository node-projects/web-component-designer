import { IPoint } from '../../interfaces/IPoint.js';
import { IRect } from '../../interfaces/IRect.js';
import { IDesignItem } from '../item/IDesignItem.js';
import { NodeType } from '../item/NodeType.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';

export function inDesigner(element: Element): boolean {
  let node = element.getRootNode();
  if ((<ShadowRoot>node)?.host?.localName == "node-projects-designer-canvas")
    return true;
  return false;
}

export function newElementFromString(text, document: Document): Element {
  const range = document.createRange();
  //@ts-ignore
  const fragment = range.createContextualFragment(text, { includeShadowRoots: true });
  return fragment.firstChild as Element;
}

export enum ElementDisplayType {
  none,
  inline,
  block,
}

export function isInline(element: HTMLElement): boolean {
  if (element == null)
    return false;
  if (element instanceof (element.ownerDocument.defaultView ?? window).SVGElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHtmlElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHeadElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLBodyElement)
    return false;
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display.startsWith('inline');
}

export function isInlineAfter(element: HTMLElement): boolean {
  if (element == null)
    return false;
  if (element instanceof (element.ownerDocument.defaultView ?? window).SVGElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHtmlElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHeadElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLBodyElement)
    return false;
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display.startsWith('inline');
}

export function getElementDisplaytype(element: HTMLElement): ElementDisplayType {
  if (element instanceof (element.ownerDocument.defaultView ?? window).SVGElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHtmlElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHeadElement || element instanceof (element.ownerDocument.defaultView ?? window).HTMLBodyElement)
    return ElementDisplayType.block;
  if (element instanceof (element.ownerDocument.defaultView ?? window).MathMLElement)
    return ElementDisplayType.block;
  const display = (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display;
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

const windowOffsetsCacheKey = Symbol('windowOffsetsCacheKey');
export function getElementsWindowOffsetWithoutSelfAndParentTransformations(element, zoom: number, cache: Record<string | symbol, any> = {}) {
  let offsetLeft = 0;
  let offsetTop = 0;

  let ch: Map<any, { offsetLeft: number, offsetTop: number }>;
  if (cache)
    ch = cache[windowOffsetsCacheKey] ??= new Map<any, { offsetLeft: number, offsetTop: number }>();
  else
    ch = new Map<any, { offsetLeft: number, offsetTop: number }>();

  let lst: { offsetLeft: number, offsetTop: number }[] = [];

  let currentElement = element;
  while (currentElement) {
    let cachedObj = ch.get(currentElement);
    if (cachedObj) {
      offsetLeft += cachedObj.offsetLeft;
      offsetTop += cachedObj.offsetTop;

      lst.forEach(x => { x.offsetLeft += cachedObj.offsetLeft; x.offsetTop += cachedObj.offsetTop; });
      break;
    }

    let nextParent = currentElement.offsetParent ? currentElement.offsetParent : (<ShadowRoot>currentElement.getRootNode()).host;

    if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).SVGSVGElement ||
      currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).HTMLBodyElement ||
      currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).HTMLHtmlElement) {
      nextParent = currentElement.parentElement ? currentElement.parentElement : (<ShadowRoot>currentElement.getRootNode()).host;
    } else if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).SVGGraphicsElement) {
      nextParent = currentElement.ownerSVGElement;
    } else if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).MathMLElement) {
      nextParent = currentElement.parentElement ?? nextParent;
    }

    let scrollLeft = 0;
    let scrollTop = 0;
    if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).HTMLElement) {
      let parent = currentElement.parentElement;
      while (parent !== null && parent !== nextParent) {
        scrollLeft += parent.scrollLeft;
        scrollTop += parent.scrollTop;
        parent = parent.parentElement;
      }
    }

    if (nextParent) {
      scrollLeft += nextParent.scrollLeft;
      scrollTop += nextParent.scrollTop;
    }

    let currLeft = 0;
    let currTop = 0;
    if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).SVGSVGElement ||
      currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).MathMLElement) {
      //TODO: !maybe huge Perf impact! - fix without transformation
      let t = currentElement.style.transform;
      currentElement.style.transform = '';
      const bcEl = currentElement.getBoundingClientRect();
      const bcPar = currentElement.parentElement ? currentElement.parentElement.getBoundingClientRect() : (<ShadowRoot>currentElement.getRootNode()).host.getBoundingClientRect();
      currentElement.style.transform = t;
      currLeft = (bcEl.left - bcPar.left) / zoom;
      currTop = (bcEl.top - bcPar.top) / zoom;
    } else if (currentElement instanceof (currentElement.ownerDocument.defaultView ?? window).SVGGraphicsElement) {
      let bbox = currentElement.getBBox();
      currLeft = bbox.x
      currTop = bbox.y;
    } else if (element == currentElement && (element === element.ownerDocument.body || element instanceof (element.ownerDocument.defaultView ?? window).HTMLHtmlElement)) {
      const cs = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
      currLeft = element.offsetLeft - scrollLeft + parseInt(cs.marginLeft);
      currTop = element.offsetTop - scrollTop + parseInt(cs.marginTop);
    } else {
      currLeft = currentElement.offsetLeft - scrollLeft;
      currTop = currentElement.offsetTop - scrollTop;
    }

    lst.forEach(x => { x.offsetLeft += currLeft; x.offsetTop += currTop });
    const cacheEntry = { offsetLeft: currLeft, offsetTop: currTop };
    lst.push(cacheEntry);
    ch.set(currentElement, cacheEntry);

    offsetLeft += currLeft;
    offsetTop += currTop;

    currentElement = nextParent;
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

  return { x: xOffset, y: yOffset };
}

export function calculateOuterRect(designItems: IDesignItem[], designerCanvas: IDesignerCanvas): IRect {
  let min: IPoint = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
  let max: IPoint = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };
  let elementRect: IRect;

  for (let s of designItems) {
    if (s.nodeType == NodeType.TextNode || s.nodeType == NodeType.Comment)
      continue;
    elementRect = {
      x: designerCanvas.getNormalizedElementCoordinates(s.element).x,
      y: designerCanvas.getNormalizedElementCoordinates(s.element).y,
      width: designerCanvas.getNormalizedElementCoordinates(s.element).width,
      height: designerCanvas.getNormalizedElementCoordinates(s.element).height
    }

    // calculate min and max of selection
    if (elementRect.x < min.x)
      min.x = elementRect.x;
    if (elementRect.y < min.y)
      min.y = elementRect.y;
    if (elementRect.x + elementRect.width > max.x)
      max.x = elementRect.x + elementRect.width;
    if (elementRect.y + elementRect.height > max.y)
      max.y = elementRect.y + elementRect.height;
  }

  // calculate reckt around selection
  return {
    x: min.x,
    y: min.y,
    width: max.x - min.x,
    height: max.y - min.y
  }
}