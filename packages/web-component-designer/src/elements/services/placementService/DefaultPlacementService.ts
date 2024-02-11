import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { combineTransforms, extractTranslationFromDOMMatrix, getResultingTransformationBetweenElementAndAllAncestors } from '../../helper/TransformHelper.js';
import { filterChildPlaceItems, getDesignItemCurrentPos, placeDesignItem } from '../../helper/LayoutHelper.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { ExtensionType } from '../../widgets/designerView/extensions/ExtensionType.js';
import { straightenLine } from '../../helper/PathDataPolyfill.js';

export class DefaultPlacementService implements IPlacementService {

  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration) {
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

  private calculateTrack(event: MouseEvent, placementView: IPlacementView, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, item: IDesignItem): IPoint {
    let trackX = newPoint.x - startPoint.x;
    let trackY = newPoint.y - startPoint.y;

    if (!event.ctrlKey) {
      if (placementView.alignOnGrid) {
        let p = getDesignItemCurrentPos(item, 'position');
        p.x = p.x % placementView.gridSize;
        p.y = p.y % placementView.gridSize;
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize - p.x;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize - p.y;
      }
      else if (placementView.alignOnSnap) {
        let rect = item.element.getBoundingClientRect();
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

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    let trackX = newPoint.x;
    let trackY = newPoint.y;

    if (!event.ctrlKey) {
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

  startPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    //TODO: this should revert all undo actions while active
    //maybe a undo actions returns itself or an id so it could be changed?
    let track = this.calculateTrack(event, placementView, startPoint, offsetInControl, newPoint, items[0]);
    if (event.shiftKey) {
      track = straightenLine({ x: 0, y: 0 }, track, true);
    }
    let filteredItems = filterChildPlaceItems(items);
    for (const designItem of filteredItems) {
      const canvas = designItem.element.closest('#node-projects-designer-canvas-canvas');
      let originalElementAndAllAncestorsMultipliedMatrix: DOMMatrix = getResultingTransformationBetweenElementAndAllAncestors(<HTMLElement>designItem.element.parentElement, <HTMLElement>canvas, true);

      let transformMatrixParentTransformsCompensated = null;
      if (originalElementAndAllAncestorsMultipliedMatrix) {
        transformMatrixParentTransformsCompensated = new DOMPoint(track.x, track.y, 0, 0).matrixTransform(originalElementAndAllAncestorsMultipliedMatrix.inverse());
      } else {
        transformMatrixParentTransformsCompensated = new DOMPoint(track.x, track.y, 0, 0);
      }

      const translationMatrix = new DOMMatrix().translate(transformMatrixParentTransformsCompensated.x, transformMatrixParentTransformsCompensated.y);
      combineTransforms((<HTMLElement>designItem.element), designItem.getStyle('transform'), translationMatrix.toString());
    }
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
  }

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
    let filterdItems = filterChildPlaceItems(items);
    for (let i of filterdItems) {
      container.insertChild(i);

      if (i.lastContainerSize) {
        if (!i.hasStyle('width'))
          i.setStyle('width', i.lastContainerSize.width + 'px');
        if (!i.hasStyle('height'))
          i.setStyle('height', i.lastContainerSize.height + 'px');
      }
    }
  }

  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    let filterdItems = filterChildPlaceItems(items);
    for (const designItem of filterdItems) {
      let translation: DOMPoint = extractTranslationFromDOMMatrix(new DOMMatrix((<HTMLElement>designItem.element).style.transform));
      const stylesMapOffset: DOMPoint = extractTranslationFromDOMMatrix(new DOMMatrix(designItem.getStyle('transform') ?? ''));
      (<HTMLElement>designItem.element).style.transform = designItem.getStyle('transform') ?? '';
      let track = { x: translation.x, y: translation.y };
      placeDesignItem(container, designItem, { x: track.x - stylesMapOffset.x, y: track.y - stylesMapOffset.y }, 'position');
    }

    for (const item of items) {
      (<DesignerCanvas>placementView).extensionManager.removeExtension(item, ExtensionType.Placement);
    }
  }
}