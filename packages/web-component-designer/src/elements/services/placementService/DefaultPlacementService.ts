import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { combineTransforms, extractTranslationFromDOMMatrix } from '../../helper/TransformHelper.js';
import { filterChildPlaceItems, getDesignItemCurrentPos, placeDesignItem } from '../../helper/LayoutHelper.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { ExtensionType } from '../../widgets/designerView/extensions/ExtensionType.js';
import { straightenLine } from '../../helper/PathDataPolyfill.js';
import { hasCommandKey } from '../../helper/KeyboardHelper.js';
import { NodeType } from '../../item/NodeType.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { getBoundingClientRectAlsoForDisplayContents } from '../../helper/ElementHelper.js';

export function filterNonElementItems(items: IDesignItem[]) {
  const filterdPlaceItems: IDesignItem[] = [];
  next:
  for (let i of items) {
    if (i.nodeType === NodeType.TextNode || i.nodeType === NodeType.Comment)
      continue
    filterdPlaceItems.push(i);
  }
  return filterdPlaceItems;
}

export class DefaultPlacementService implements IPlacementService {

  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration, item?: IDesignItem) {
    if (item != null && item.getComputedStyle()?.position == 'absolute')
      return true;
    if (containerStyle.display === 'grid' || containerStyle.display === 'inline-grid' ||
      containerStyle.display === 'flex' || containerStyle.display === 'inline-flex')
      return false;
    return true;
  }

  isEnterableContainer(container: IDesignItem) {
    if (DomConverter.IsSelfClosingElement(container.element.localName))
      return false;
    if (!container.isRootItem && container.element.shadowRoot && container.element.shadowRoot.querySelector('slot') == null)
      return false;
    return true;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    if (!this.isEnterableContainer(container))
      return false;
    if (!items.every(x => !x.element.contains(container.element) && x !== container))
      return false;
    return true;
  }

  canLeave(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  getElementOffset(container: IDesignItem, designItem?: IDesignItem): IPoint {
    return container.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(container.element);
  }

  private calculateTrack(event: MouseEvent, placementView: IDesignerCanvas, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, item: IDesignItem): IPoint {
    let trackX = newPoint.x - startPoint.x;
    let trackY = newPoint.y - startPoint.y;

    if (!hasCommandKey(event)) {
      if (placementView.alignOnGrid) {
        let p = getDesignItemCurrentPos(item, 'position');
        p.x = p.x % placementView.gridSize;
        p.y = p.y % placementView.gridSize;
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize - p.x;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize - p.y;
      }
      else if (placementView.alignOnSnap) {
        let rect = getBoundingClientRectAlsoForDisplayContents(item.element);
        let newPos = placementView.snapLines.snapToPosition({ x: (newPoint.x - offsetInControl.x), y: (newPoint.y - offsetInControl.y) }, { width: rect.width / placementView.scaleFactor, height: rect.height / placementView.scaleFactor }, { x: trackX > 0 ? 1 : -1, y: trackY > 0 ? 1 : -1 })
        if (newPos.x !== null) {
          trackX = newPos.x - Math.round(startPoint.x) + Math.round(offsetInControl.x);
        } else {
          trackX = Math.round(trackX);
        }
        if (newPos.y !== null) {
          trackY = newPos.y - Math.round(startPoint.y) + Math.round(offsetInControl.y);
        } else {
          trackY = Math.round(trackY);
        }
      }
    }
    return { x: trackX, y: trackY };
  }

  placePoint(event: MouseEvent, placementView: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    let trackX = newPoint.x;
    let trackY = newPoint.y;

    if (!hasCommandKey(event)) {
      if (placementView.alignOnGrid) {
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize;
      }
      else if (placementView.alignOnSnap) {
        let newPos = placementView.snapLines.snapToPosition({ x: newPoint.x - offsetInControl.x, y: newPoint.y - offsetInControl.y }, null, { x: trackX > 0 ? 1 : -1, y: trackY > 0 ? 1 : -1 })
        if (newPos.x !== null) {
          trackX = newPos.x;
        } else {
          trackX = Math.round(trackX);
        }
        if (newPos.y !== null) {
          trackY = newPos.y;
        } else {
          trackY = Math.round(trackY);
        }
      }
    }

    return { x: trackX, y: trackY };
  }

  startPlace(event: MouseEvent, placementView: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
  }

  place(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    //TODO: this should revert all undo actions while active
    //maybe a undo actions returns itself or an id so it could be changed?
    let track = this.calculateTrack(event, designerCanvas, startPoint, offsetInControl, newPoint, items[0]);

    if (event.shiftKey) {
      track = straightenLine({ x: 0, y: 0 }, track, true);
    }
    let filteredItems = filterChildPlaceItems(filterNonElementItems(items));
    for (const designItem of filteredItems) {
      const canvas = designItem.instanceServiceContainer.designerCanvas.canvas;
      const quad = designItem.parent.element.getBoxQuads({ relativeTo: canvas, iframes: designItem.instanceServiceContainer.designerCanvas.iframes })[0];
      let transformedPoint: DOMPoint = designItem.parent.element.convertPointFromNode(new DOMPoint(track.x + quad.p1.x, track.y + quad.p1.y), <HTMLElement>canvas, { iframes: designItem.instanceServiceContainer.designerCanvas.iframes });

      const cs = getComputedStyle(designItem.element);
      let m = new DOMMatrix();
      if (cs.rotate != 'none' && cs.rotate) {
        m = m.multiply(new DOMMatrix('rotate(' + cs.rotate.replace(' ', ',') + ')'));
      }
      if (cs.scale != 'none' && cs.scale) {
        m = m.multiply(new DOMMatrix('scale(' + cs.scale.replace(' ', ',') + ')'));
      }
      transformedPoint = m.inverse().transformPoint(transformedPoint);

      const translationMatrix = new DOMMatrix().translate(transformedPoint.x, transformedPoint.y);
      combineTransforms((<HTMLElement>designItem.element), designItem.getStyle('transform'), translationMatrix.toString());
    }
    items[0].instanceServiceContainer.designerCanvas?.raiseDesignItemsChanged(filteredItems, 'place', false);
  }

  moveElements(designItems: IDesignItem[], position: IPoint, absolute: boolean) {
    //TODO: Check if we set left or right
    //TODO: Use CSS units

    for (let d of designItems) {
      if (position.x)
        d.setStyle('left', parseInt((<HTMLElement>d.element).style.left) - position.x + 'px');
      if (position.y)
        d.setStyle('top', parseInt((<HTMLElement>d.element).style.top) - position.y + 'px');
    }
    designItems[0].instanceServiceContainer.designerCanvas.extensionManager.refreshExtensions(designItems);
    designItems[0].instanceServiceContainer.designerCanvas?.raiseDesignItemsChanged(designItems, 'place', true);
  }

  enterContainer(container: IDesignItem, items: IDesignItem[], mode: 'normal' | 'drop') {
    let filteredItems = filterChildPlaceItems(items);
    for (let i of filteredItems) {
      if (mode == 'drop')
        i.setStyle('position', 'absolute');
      container.insertChild(i);

      if (i.lastContainerSize) {
        if (!i.hasStyle('width'))
          i.setStyle('width', i.lastContainerSize.width + 'px');
        if (!i.hasStyle('height'))
          i.setStyle('height', i.lastContainerSize.height + 'px');
      }
    }
    items[0].instanceServiceContainer.designerCanvas?.raiseDesignItemsChanged(filteredItems, 'place', true);
  }

  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
    let filteredItems = filterChildPlaceItems(items);
    items[0].instanceServiceContainer.designerCanvas?.raiseDesignItemsChanged(filteredItems, 'place', true);
  }

  finishPlace(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    let filteredItems = filterChildPlaceItems(items);
    for (const designItem of filteredItems) {
      let translation: DOMPoint = extractTranslationFromDOMMatrix(new DOMMatrix((<HTMLElement>designItem.element).style.transform));
      const stylesMapOffset: DOMPoint = extractTranslationFromDOMMatrix(new DOMMatrix(designItem.getStyle('transform') ?? ''));
      (<HTMLElement>designItem.element).style.transform = designItem.getStyle('transform') ?? '';
      let track = { x: translation.x, y: translation.y };

      const cs = getComputedStyle(designItem.element);
      let m = new DOMMatrix();
      if (cs.rotate != 'none' && cs.rotate) {
        m = m.multiply(new DOMMatrix('rotate(' + cs.rotate.replace(' ', ',') + ')'));
      }
      if (cs.scale != 'none' && cs.scale) {
        m = m.multiply(new DOMMatrix('scale(' + cs.scale.replace(' ', ',') + ')'));
      }
      track = m.transformPoint(track);

      placeDesignItem(container, designItem, { x: track.x - stylesMapOffset.x, y: track.y - stylesMapOffset.y }, 'position');
    }

    for (const item of items) {
      (<DesignerCanvas>designerCanvas).extensionManager.removeExtension(item, ExtensionType.Placement);
    }
    items[0].instanceServiceContainer.designerCanvas?.raiseDesignItemsChanged(filteredItems, 'place', true);
  }
}