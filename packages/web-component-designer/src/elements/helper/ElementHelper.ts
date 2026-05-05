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

export function instanceOf<T extends Function>(node: any, fnc: T): node is T {
  if (node instanceof fnc || node instanceof (node.ownerDocument.defaultView ?? window)[fnc.name])
    return true;
  return false;
}

export function instanceOfAny(node: Node, ...fnc: Function[]) {
  for (const f of fnc)
    if (node instanceof f || node instanceof (node.ownerDocument.defaultView ?? window)[f.name])
      return true;
  return false;
}

export function isInline(element: HTMLElement): boolean {
  if (element == null)
    return false;
  if (instanceOfAny(element, SVGElement, HTMLHtmlElement, HTMLHeadElement, HTMLBodyElement, HTMLSelectElement, HTMLOptionElement))
    return false;
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display.startsWith('inline');
}

export function isInlineAfter(element: HTMLElement): boolean {
  if (element == null)
    return false;
  if (instanceOfAny(element, SVGElement, HTMLHtmlElement, HTMLHeadElement, HTMLBodyElement, HTMLSelectElement, HTMLOptionElement))
    return false;
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display.startsWith('inline');
}

export function getElementDisplaytype(element: HTMLElement): ElementDisplayType {
  if (instanceOfAny(element, SVGElement, HTMLHtmlElement, HTMLHeadElement, HTMLBodyElement))
    return ElementDisplayType.block;
  if (instanceOf(element, MathMLElement))
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

export function getElementOffsetsInContainer(element: Element) {
  if (instanceOf(element, HTMLElement)) {
    //@ts-ignore
    return { x: element.offsetLeft, y: element.offsetTop };
  } else {
    //const cs = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);

    //todo: this will not work correctly with transformed SVGs or MathML Elements 
    const r1 = getBoundingClientRectAlsoForDisplayContents(element);
    const r2 = getBoundingClientRectAlsoForDisplayContents(element.parentElement);
    return { x: r1.x - r2.x, y: r1.y - r2.y }
  }
}

export function getBoundingClientRectAlsoForDisplayContents(element: Element): DOMRect {
  let r = element.getBoundingClientRect();
  if (r.width == 0 && r.height == 0) {
    const cs = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
    if (cs.display == 'contents') {
      if (element.shadowRoot) {
        for (let c of element.shadowRoot.children) {
          const rc = getBoundingClientRectAlsoForDisplayContents(c);
          r = new DOMRect(
            Math.min(r.x, rc.x),
            Math.min(r.y, rc.y),
            Math.max(r.width, rc.width),
            Math.max(r.height, rc.height)
          );
        }
      } else {
        for (let c of element.children) {
          const rc = getBoundingClientRectAlsoForDisplayContents(c);
          r = new DOMRect(
            Math.min(r.x, rc.x),
            Math.min(r.y, rc.y),
            Math.max(r.width, rc.width),
            Math.max(r.height, rc.height)
          );
        }
      }
    }
  }
  return r;
}

export function getElementZoomFactor(element: Element): number {
  const zoom = (element.ownerDocument.defaultView ?? window).getComputedStyle(element).zoom;
  if (!zoom || zoom === 'normal')
    return 1;
  if (zoom.endsWith('%')) {
    const percentage = parseFloat(zoom);
    return Number.isFinite(percentage) && percentage > 0 ? percentage / 100 : 1;
  }
  const value = parseFloat(zoom);
  return Number.isFinite(value) && value > 0 ? value : 1;
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