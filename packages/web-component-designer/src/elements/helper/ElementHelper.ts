import { IPoint } from '../../interfaces/IPoint.js';
import { IRect } from '../../interfaces/IRect.js';
import { IDesignItem } from '../item/IDesignItem.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';

export function inDesigner(element: Element): boolean {
  let node = element.getRootNode();
  if ((<ShadowRoot>node)?.host?.localName == "node-projects-designer-canvas")
    return true;
  return false;
}

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

const windowOffsetsCacheKey = Symbol('windowOffsetsCacheKey');
export function getElementsWindowOffsetWithoutSelfAndParentTransformations(element, zoom: number, cache: Record<string | symbol, any> = {}) {
  let offsetLeft = 0;
  let offsetTop = 0;

  let ch: Map<any, { offsetLeft: number, offsetTop: number }> = cache[windowOffsetsCacheKey] ??= new Map<any, { offsetLeft: number, offsetTop: number }>();
  let lst: { offsetLeft: number, offsetTop: number }[] = [];

  while (element) {
    let cachedObj = ch.get(element);
    if (cachedObj) {
      offsetLeft += cachedObj.offsetLeft;
      offsetTop += cachedObj.offsetTop;

      lst.forEach(x => { x.offsetLeft += cachedObj.offsetLeft; x.offsetTop += cachedObj.offsetTop; });
      break;
    }
    if (element instanceof SVGSVGElement) {
      //TODO: !huge Perf impact! - fix without transformation
      let t = element.style.transform;
      element.style.transform = '';
      const bcEl = element.getBoundingClientRect();
      const bcPar = element.parentElement.getBoundingClientRect();
      element.style.transform = t;
      const currLeft = (bcEl.left - bcPar.left) / zoom;
      const currTop = (bcEl.top - bcPar.top) / zoom;
      offsetLeft += currLeft;
      offsetTop += currTop;

      lst.forEach(x => { x.offsetLeft += currLeft; x.offsetTop += currTop });
      const cacheEntry = { offsetLeft: currLeft, offsetTop: currTop };
      lst.push(cacheEntry);
      ch.set(element, cacheEntry);

      element = element.parentElement;
    } else if (element instanceof SVGGraphicsElement) {
      let bbox = element.getBBox();
      offsetLeft += bbox.x;
      offsetTop += bbox.y;

      lst.forEach(x => { x.offsetLeft += bbox.x; x.offsetTop += bbox.y });
      const cacheEntry = { offsetLeft: bbox.x, offsetTop: bbox.y };
      lst.push(cacheEntry);
      ch.set(element, cacheEntry);

      element = element.ownerSVGElement;
    } else if (element instanceof HTMLBodyElement) {
      element = element.parentElement;
    } else if (element instanceof HTMLHtmlElement) {
      element = element.parentElement;
    } else {
      const currLeft = element.offsetLeft;
      const currTop = element.offsetTop;

      lst.forEach(x => { x.offsetLeft += currLeft; x.offsetTop += currTop });
      const cacheEntry = { offsetLeft: currLeft, offsetTop: currTop };
      lst.push(cacheEntry);
      ch.set(element, cacheEntry);

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

  return { x: xOffset, y: yOffset };
}

export function calculateOuterRect(designItems: IDesignItem[], designerCanvas: IDesignerCanvas): IRect {
  let min: IPoint = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
  let max: IPoint = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };
  let elementRect: IRect;

  for (let s of designItems) {
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