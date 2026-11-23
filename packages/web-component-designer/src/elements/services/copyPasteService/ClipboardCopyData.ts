import type { IDesignItem } from "../../item/IDesignItem.js";
import type { IRect } from "../../../interfaces/IRect.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { filterChildPlaceItems } from "../../helper/LayoutHelper.js";

export interface ClipboardCopyData { html?: string; positions?: (IRect | null)[]; }

/** Serialize SVG selections with the viewport, inherited context and resources needed to paste them. */
export function createClipboardCopyData(designItems: IDesignItem[]): ClipboardCopyData {
  const items = filterChildPlaceItems(designItems);
  const fragments: (string | SVGSVGElement)[] = [], positions: (IRect | null)[] = [];
  const layers = new Map<SVGSVGElement, { root: SVGSVGElement; ancestors: Map<Element, Element> }>();
  for (const item of items) {
    const element = item.element, canvas = item.instanceServiceContainer.designerCanvas;
    const win = element.ownerDocument.defaultView ?? window;
    const contentMode = item.serviceContainer.options.svgEditingMode === 'content';
    if (contentMode && element instanceof win.SVGElement && element.ownerSVGElement) {
      let owner = element.ownerSVGElement;
      while (owner.ownerSVGElement) owner = owner.ownerSVGElement;
      let layer = layers.get(owner);
      if (!layer) {
        const root = owner.cloneNode(false) as SVGSVGElement;
        root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        for (const name of ['viewBox', 'preserveAspectRatio', 'x', 'y', 'width', 'height', 'transform', 'data-svg-object']) root.removeAttribute(name);
        for (const name of ['rotate', 'scale', 'translate', 'transform']) root.style.removeProperty(name);
        Object.assign(root.style, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', overflow: 'visible', transformOrigin: '0 0' });
        const screen = owner.getScreenCTM();
        if (screen) {
          const origin = canvas.getNormalizedEventCoordinates({ clientX: screen.e, clientY: screen.f } as PointerEvent);
          const x = canvas.getNormalizedEventCoordinates({ clientX: screen.e + screen.a, clientY: screen.f + screen.b } as PointerEvent);
          const y = canvas.getNormalizedEventCoordinates({ clientX: screen.e + screen.c, clientY: screen.f + screen.d } as PointerEvent);
          root.style.transform = new win.DOMMatrix([x.x - origin.x, x.y - origin.y, y.x - origin.x, y.y - origin.y, origin.x, origin.y]).toString();
        }
        layer = { root, ancestors: new Map([[owner, root]]) };
        layers.set(owner, layer); fragments.push(root); positions.push(null);
        for (const resource of owner.children) if (resource.localName === 'defs' || resource.localName === 'style') root.append(resource.cloneNode(true));
      }
      const parents: Element[] = [];
      for (let parent: Element = element.parentElement; parent && parent !== (owner as Element); parent = parent.parentElement) parents.unshift(parent);
      let target: Element = layer.root;
      for (const parent of parents) {
        let clone = layer.ancestors.get(parent);
        if (!clone) {
          clone = parent.cloneNode(false) as Element;
          for (const resource of parent.children) if (resource.localName === 'defs' || resource.localName === 'style') clone.append(resource.cloneNode(true));
          target.append(clone); layer.ancestors.set(parent, clone);
        }
        target = clone;
      }
      const snapshot = element.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
      snapshot.innerHTML = DomConverter.ConvertToString([item], false);
      target.append(...snapshot.childNodes);
    } else {
      fragments.push(DomConverter.ConvertToString([item], false));
      positions.push(contentMode && element instanceof win.SVGSVGElement ? null : canvas.getNormalizedElementCoordinates(element));
    }
  }
  return { html: fragments.map(fragment => typeof fragment === 'string' ? fragment : fragment.outerHTML).join(''), positions };
}
