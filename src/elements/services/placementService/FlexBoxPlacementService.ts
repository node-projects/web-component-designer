import { IPoint } from '../../../interfaces/IPoint.js';
import { IRect } from '../../../interfaces/IRect.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { IPlacementView } from '../../widgets/designerView/IPlacementView.js';
import { DefaultPlacementService } from './DefaultPlacementService.js';
import { IPlacementService } from './IPlacementService.js';

export class FlexBoxPlacementService implements IPlacementService {

  enterContainer(container: IDesignItem, items: IDesignItem[]) {
    for (let i of items) {
      i.removeStyle("position");
      i.removeStyle("left");
      i.removeStyle("top");
      i.removeStyle("right");
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
    if (containerStyle.display == 'flex' || containerStyle.display == 'inline-flex')
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

  place(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    const pos = (<IDesignerCanvas><unknown>placementView).getNormalizedEventCoordinates(event);
    const style = getComputedStyle(container.element);
    const childrenWithPos: [IDesignItem, IRect][] = Array.from(container.children()).filter(x => !x.isEmptyTextNode).map(x => [x, (<IDesignerCanvas><unknown>placementView).getNormalizedElementCoordinates(x.element)]);
    if (style.flexDirection == 'row') {
      childrenWithPos.sort(x => x[1].x);
      let elBefore: [IDesignItem, IRect] = null;
      for (let c of childrenWithPos) {
        if (c[1].x + c[1].width / 2 < pos.x) {
          elBefore = c;
        }
      }
      if (elBefore && elBefore[0] != items[0]) {
        items[0].remove();
        elBefore[0].insertAdjacentElement(items[0], 'afterend');
      } else if (elBefore == null) {
        items[0].remove();
        container.insertChild(items[0], 0);
      }
    } else if (style.flexDirection == 'column') {
      childrenWithPos.sort(x => x[1].y);
      let elBefore: [IDesignItem, IRect] = null;
      for (let c of childrenWithPos) {
        if (c[1].y + c[1].height / 2 < pos.y) {
          elBefore = c;
        }
      }
      if (elBefore && elBefore[0] != items[0]) {
        items[0].remove();
        elBefore[0].insertAdjacentElement(items[0], 'afterend');
      } else if (elBefore == null) {
        items[0].remove();
        container.insertChild(items[0], 0);
      }
    }

    (<DesignerCanvas>placementView).extensionManager.refreshAllExtensions([container]);
  }

  finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {

  }
}
