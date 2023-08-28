import type { IPoint } from '../../../interfaces/IPoint.js';
import type { IPlacementService } from './IPlacementService.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { calculateGridInformation, getElementGridInformation } from '../../helper/GridHelper.js';
import { pointInRect } from '../../helper/Helper.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { DefaultPlacementService } from './DefaultPlacementService.js';


export class GridPlacementService implements IPlacementService {

  private _basePlacementService;

  public constructor(basePlacementService: IPlacementService) {
    this._basePlacementService = basePlacementService ?? new DefaultPlacementService();
  }

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

  isEnterableContainer(container: IDesignItem) {
    return this._basePlacementService.isEnterableContainer(container);
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    return this._basePlacementService.canEnter(container, items);
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
    const gridInformation = calculateGridInformation(container);
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);
    //pos.x -= offsetInControl.x;
    //pos.y -= offsetInControl.y;
    let row = 0;
    let column = 0;
    for (let cellRow of gridInformation.cells) {
      column = 0
      for (let cell of cellRow) {
        if (pointInRect(pos, cell)) {
          let info = getElementGridInformation(<HTMLElement>items[0].element);
          if (cell.name) {
            (<HTMLElement>items[0].element).style.gridColumn = '';
            (<HTMLElement>items[0].element).style.gridRow = '';
            (<HTMLElement>items[0].element).style.gridArea = cell.name;
          } else {
            (<HTMLElement>items[0].element).style.gridArea = '';
            (<HTMLElement>items[0].element).style.gridColumn = (column + 1) + (info.colSpan > 1 ? ' / span ' + info.colSpan : '');
            (<HTMLElement>items[0].element).style.gridRow = (row + 1) + (info.rowSpan > 1 ? ' / span ' + info.rowSpan : '');
          }
        }
        column++;
      }
      row++;
    }
    (<DesignerCanvas>placementView).extensionManager.refreshAllExtensions([container]);
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    const gridInformation = calculateGridInformation(container);
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);
    //pos.x -= offsetInControl.x;
    //pos.y -= offsetInControl.y;

    let row = 0;
    let column = 0;
    row = 0;
    for (let cellRow of gridInformation.cells) {
      column = 0
      for (let cell of cellRow) {
        if (pointInRect(pos, cell)) {
          let info = getElementGridInformation(<HTMLElement>items[0].element);
          //Grid Area is shorthand for grid row/column, to make undo work correctly we need to set befor and after clear
          if (cell.name) {
            items[0].setStyle('grid-area', cell.name);
            items[0].removeStyle('grid-column');
            items[0].removeStyle('grid-row');
            items[0].setStyle('grid-area', cell.name);
          } else {
            items[0].setStyle('grid-column', (column + 1) + (info.colSpan > 1 ? ' / span ' + info.colSpan : ''));
            items[0].setStyle('grid-row', (row + 1) + (info.rowSpan > 1 ? ' / span ' + info.rowSpan : ''));
            items[0].removeStyle('grid-area');
            items[0].setStyle('grid-column', (column + 1) + (info.colSpan > 1 ? ' / span ' + info.colSpan : ''));
            items[0].setStyle('grid-row', (row + 1) + (info.rowSpan > 1 ? ' / span ' + info.rowSpan : ''));
          }
        }
        column++;
      }
      row++;
    }
    (<DesignerCanvas>placementView).extensionManager.refreshAllExtensions([container]);
  }

  moveElements(designItems: IDesignItem[], position: IPoint, absolute: boolean) {
  }
}