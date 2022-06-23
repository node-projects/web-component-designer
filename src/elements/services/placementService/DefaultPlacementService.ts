import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { combineTransforms, getTranslationMatrix3d, matrixArrayToCssMatrix } from '../../helper/TransformHelper.js';
import { filterChildPlaceItems, placeDesignItem } from '../../helper/LayoutHelper.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { ExtensionType } from '../../widgets/designerView/extensions/ExtensionType.js';

export class DefaultPlacementService implements IPlacementService {

  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration) {
    if (containerStyle.display === 'grid' || containerStyle.display === 'inline-grid' ||
      containerStyle.display === 'flex' || containerStyle.display === 'inline-flex')
      return false;
    return true;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    if (DomConverter.IsSelfClosingElement(container.element.localName))
      return false;
    if (container.element.shadowRoot && container.element.shadowRoot.querySelector('slot') == null)
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
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize;
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
    for (const item of items) {
      (<DesignerCanvas>placementView).extensionManager.removeExtension(item, ExtensionType.Placement);
      (<DesignerCanvas>placementView).extensionManager.removeExtension(item, ExtensionType.MouseOver);
      (<DesignerCanvas>placementView).extensionManager.applyExtension(item, ExtensionType.Placement);
    }
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    //TODO:, this should revert all undo actions while active
    //maybe a undo actions returns itself or an id so it could be changed?
    let track = this.calculateTrack(event, placementView, startPoint, offsetInControl, newPoint, items[0]);
    let filteredItems = filterChildPlaceItems(items);
    for (const designItem of filteredItems) {
      const translationMatrix = getTranslationMatrix3d(track.x, track.y, 0);
      combineTransforms((<HTMLElement>designItem.element), designItem.styles.get('transform'), matrixArrayToCssMatrix(translationMatrix));
    }
  }

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
    let filterdItems = filterChildPlaceItems(items);
    for (let i of filterdItems) {
      if (i.lastContainerSize) {
        if (!i.styles.has('width'))
          i.setStyle('width', i.lastContainerSize.width + 'px');
        if (!i.styles.has('height'))
          i.setStyle('height', i.lastContainerSize.height + 'px');
      }
    }
  }

  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    let track = this.calculateTrack(event, placementView, startPoint, offsetInControl, newPoint, items[0]);

    let filterdItems = filterChildPlaceItems(items);
    for (const designItem of filterdItems) {
      (<HTMLElement>designItem.element).style.transform = designItem.styles.get('transform') ?? '';
      placeDesignItem(container, designItem, track, 'position');
    }

    for (const item of items) {
      (<DesignerCanvas>placementView).extensionManager.removeExtension(item, ExtensionType.Placement);
    }

  }
}