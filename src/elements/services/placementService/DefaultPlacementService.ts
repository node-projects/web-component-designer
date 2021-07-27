import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IDesignerMousePoint } from '../../../interfaces/IDesignerMousePoint.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { DomConverter } from '../../widgets/designerView/DomConverter.js';

export class DefaultPlacementService implements IPlacementService {

  serviceForContainer(container: IDesignItem) {
    if ((<HTMLElement>container.element).style.display === 'grid' || (<HTMLElement>container.element).style.display === 'flex')
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
    return container.element.getBoundingClientRect();
  }

  private calculateTrack(event: MouseEvent, placementView: IPlacementView, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, item: IDesignItem): IPoint {
    let trackX = newPoint.x - startPoint.x;
    let trackY = newPoint.y - startPoint.y;

    if (!event.ctrlKey) {
      if (placementView.alignOnGrid) {
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize;
      }
      else if (placementView.alignOnSnap) {
        let rect = item.element.getBoundingClientRect();
        let newPos = placementView.snapLines.snapToPosition({ x: newPoint.originalX - startPoint.offsetInControlX, y: newPoint.originalY - startPoint.offsetInControlY }, { width: rect.width, height: rect.height }, { x: trackX > 0 ? 1 : -1, y: trackY > 0 ? 1 : -1 })
        if (newPos.x !== null) {
          trackX = newPos.x - Math.round(startPoint.originalX) + Math.round(startPoint.offsetInControlX);
        } else {
          trackX = Math.round(trackX);
        }
        if (newPos.y !== null) {
          trackY = newPos.y - Math.round(startPoint.originalY) + Math.round(startPoint.offsetInControlY);
        } else {
          trackY = Math.round(trackY);
        }
      }
    }
    return { x: trackX, y: trackY };
  }

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]): IPoint {
    let trackX = newPoint.x;
    let trackY = newPoint.y;

    if (!event.ctrlKey) {
      if (placementView.alignOnGrid) {
        trackX = Math.round(trackX / placementView.gridSize) * placementView.gridSize;
        trackY = Math.round(trackY / placementView.gridSize) * placementView.gridSize;
      }
      else if (placementView.alignOnSnap) {
        let newPos = placementView.snapLines.snapToPosition({ x: newPoint.originalX - startPoint.offsetInControlX, y: newPoint.originalY - startPoint.offsetInControlY }, null, { x: trackX > 0 ? 1 : -1, y: trackY > 0 ? 1 : -1 })
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

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {
    //TODO:, this should revert all undo actions while active
    //maybe a undo actions returns itself or an id so it could be changed?

    let track = this.calculateTrack(event, placementView, startPoint, newPoint, items[0]);

    //TODO: -> what is if a transform already exists -> backup existing style.?
    for (const designItem of items) {
      (<HTMLElement>designItem.element).style.transform = 'translate(' + track.x + 'px, ' + track.y + 'px)';
    }
  }

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IDesignerMousePoint, newPoint: IDesignerMousePoint, items: IDesignItem[]) {
    let track = this.calculateTrack(event, placementView, startPoint, newPoint, items[0]);

    for (const designItem of items) {
      let movedElement = designItem.element;

      let oldLeft = parseInt((<HTMLElement>movedElement).style.left);
      oldLeft = Number.isNaN(oldLeft) ? 0 : oldLeft;
      let oldTop = parseInt((<HTMLElement>movedElement).style.top);
      oldTop = Number.isNaN(oldTop) ? 0 : oldTop;
      //let oldPosition = movedElement.style.position;

      (<HTMLElement>designItem.element).style.transform = null;
      designItem.setStyle('position', 'absolute');
      designItem.setStyle('left', (track.x + oldLeft) + "px");
      designItem.setStyle('top', (track.y + oldTop) + "px");
    }
  }
}