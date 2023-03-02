import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { CalculateGridInformation } from '../../helper/GridHelper.js';
import { pointInRect } from '../../helper/Helper.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { DefaultPlacementService } from './DefaultPlacementService.js';

export class GridPlacementService implements IPlacementService {

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
    for (let i of items) {
      i.removeStyle("position");
      i.removeStyle("left");
      i.removeStyle("top");
      i.removeStyle("right");
      i.removeStyle("width");
      i.removeStyle("height");
      i.removeStyle("transform");
    }
  }

  leaveContainer(container: IDesignItem, items: IDesignItem[]) {
    for (let i of items) {
      if (!i.lastContainerSize) {
        const rect = i.element.getBoundingClientRect();
        i.lastContainerSize = { width: rect.width, height: rect.height };
      }
    }
  }

  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration) {
    if (containerStyle.display == 'grid' || containerStyle.display == 'inline-grid')
      return true;
    return false;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  canEnterByDrop(container: IDesignItem) {
    return true;
  }

  canLeave(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  getElementOffset(container: IDesignItem, designItem?: IDesignItem): IPoint {
    return container.element.getBoundingClientRect();
  }

  placePoint(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    const defaultPlacementService = container.serviceContainer.getLastServiceWhere('containerService', x => x instanceof DefaultPlacementService);
    return defaultPlacementService.placePoint(event, placementView, container, startPoint, offsetInControl, newPoint, items);
  }

  startPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
  }

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    const gridInformation = CalculateGridInformation(container);
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);
    const posElement = (<IDesignerCanvas><unknown>placementView).getNormalizedElementCoordinates(items[0].element)

    let row = 0;
    let column = 0;
    if (!pointInRect(pos, posElement)) {
      row = 0;
      for (let cellRow of gridInformation.cells) {
        column = 0
        for (let cell of cellRow) {
          if (pointInRect(pos, cell)) {
            if (cell.name) {
              (<HTMLElement>items[0].element).style.gridColumn = '';
              (<HTMLElement>items[0].element).style.gridRow = '';
              (<HTMLElement>items[0].element).style.gridArea = cell.name;
            } else {
              (<HTMLElement>items[0].element).style.gridArea = '';
              (<HTMLElement>items[0].element).style.gridColumn = <string><any>column + 1;
              (<HTMLElement>items[0].element).style.gridRow = <string><any>row + 1;
            }
          }
          column++;
        }
        row++;
      }
    }

    (<DesignerCanvas>placementView).extensionManager.refreshAllExtensions([container]);
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    const gridInformation = CalculateGridInformation(container);
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);

    let row = 0;
    let column = 0;
    row = 0;
    for (let cellRow of gridInformation.cells) {
      column = 0
      for (let cell of cellRow) {
        if (pointInRect(pos, cell)) {
          //Grid Area is shorthand for grid row/column, to make undo work correctly we need to set befor and after clear
          if (cell.name) {
            items[0].setStyle('grid-area', cell.name);
            items[0].removeStyle('grid-column');
            items[0].removeStyle('grid-row');
            items[0].setStyle('grid-area', cell.name);
          } else {
            items[0].setStyle('grid-column', <string><any>column + 1);
            items[0].setStyle('grid-row', <string><any>row + 1);
            items[0].removeStyle('grid-area');
            items[0].setStyle('grid-column', <string><any>column + 1);
            items[0].setStyle('grid-row', <string><any>row + 1);
          }
        }
        column++;
      }
      row++;
    }
    (<DesignerCanvas>placementView).extensionManager.refreshAllExtensions([container]);
  }
}