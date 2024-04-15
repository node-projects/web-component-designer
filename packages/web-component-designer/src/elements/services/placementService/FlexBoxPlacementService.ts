import { IPoint } from '../../../interfaces/IPoint.js';
import { IRect } from '../../../interfaces/IRect.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { DesignerCanvas } from '../../widgets/designerView/designerCanvas.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { DefaultPlacementService } from './DefaultPlacementService.js';
import { IPlacementService } from './IPlacementService.js';

export class FlexBoxPlacementService implements IPlacementService {

  private _basePlacementService;

  public constructor(basePlacementService: IPlacementService) {
    this._basePlacementService = basePlacementService ?? new DefaultPlacementService();
  }

  enterContainer(container: IDesignItem, items: IDesignItem[], mode: 'normal' | 'drop') {
    for (let i of items) {
      container.insertChild(i);

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

  serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration, item?: IDesignItem) {
    if (containerStyle.display == 'flex' || containerStyle.display == 'inline-flex') {
      if (item != null && item.getComputedStyle()?.position == 'absolute')
        return false;
      return true;
    }
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

  placePoint(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]): IPoint {
    const defaultPlacementService = container.serviceContainer.getLastServiceWhere('containerService', x => x instanceof DefaultPlacementService);
    return defaultPlacementService.placePoint(event, designerCanvas, container, startPoint, offsetInControl, newPoint, items);
  }

  startPlace(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {

  }

  place(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    const pos = (<IDesignerCanvas><unknown>designerCanvas).getNormalizedEventCoordinates(event);
    const style = getComputedStyle(container.element);
    const childrenWithPos: [IDesignItem, IRect][] = Array.from(container.children()).filter(x => !x.isEmptyTextNode).map(x => [x, designerCanvas.getNormalizedElementCoordinates(x.element)]);
    if (style.flexDirection == 'row' || style.flexDirection == 'row-reverse') {
      childrenWithPos.sort(x => x[1].x);
      let elBefore: [IDesignItem, IRect] = null;
      for (let c of childrenWithPos) {
        if (c[1].x + c[1].width / 2 < pos.x) {
          elBefore = c;
          if (style.flexDirection == 'row-reverse')
            break;
        }
      }

      let posBefore = childrenWithPos.indexOf(elBefore);
      let posDrag = childrenWithPos.indexOf(childrenWithPos.find(x => x[0] == items[0]));
      if (elBefore && elBefore[0] != items[0]) {
        if (style.flexDirection == 'row-reverse' && posBefore - 1 === posDrag)
          return;
        if (style.flexDirection == 'row' && posBefore + 1 === posDrag)
          return;
        const sel = [...container.instanceServiceContainer.selectionService.selectedElements];
        let cg = items[0].openGroup('move in flexbox');
        if (items[0].parent)
          items[0].remove();
        if (style.flexDirection == 'row-reverse')
          elBefore[0].insertAdjacentElement(items[0], 'beforebegin');
        else
          elBefore[0].insertAdjacentElement(items[0], 'afterend');
        cg.commit();
        container.instanceServiceContainer.selectionService.setSelectedElements(sel);
      } else if (elBefore == null) {
        if (posDrag == 0)
          return;
        const sel = [...container.instanceServiceContainer.selectionService.selectedElements];
        let cg = items[0].openGroup('move in flexbox');
        if (items[0].parent)
          items[0].remove();
        if (style.flexDirection == 'row-reverse')
          container.insertChild(items[0]);
        else
          container.insertChild(items[0], 0);
        cg.commit();
        container.instanceServiceContainer.selectionService.setSelectedElements(sel);
      }
    } else if (style.flexDirection == 'column' || style.flexDirection == 'column-reverse') {
      childrenWithPos.sort(x => x[1].y);
      let elBefore: [IDesignItem, IRect] = null;
      for (let c of childrenWithPos) {
        if (c[1].y + c[1].height / 2 < pos.y) {
          elBefore = c;
          if (style.flexDirection == 'column-reverse')
            break;
        }
      }
      let posBefore = childrenWithPos.indexOf(elBefore);
      let posDrag = childrenWithPos.indexOf(childrenWithPos.find(x => x[0] == items[0]));
      if (elBefore && elBefore[0] != items[0]) {
        if (style.flexDirection == 'column-reverse' && posBefore - 1 === posDrag)
          return;
        if (style.flexDirection == 'column' && posBefore + 1 === posDrag)
          return;
        const sel = [...container.instanceServiceContainer.selectionService.selectedElements];
        let cg = items[0].openGroup('move in flexbox');
        if (items[0].parent)
          items[0].remove();
        if (style.flexDirection == 'column-reverse')
          elBefore[0].insertAdjacentElement(items[0], 'beforebegin');
        else
          elBefore[0].insertAdjacentElement(items[0], 'afterend');
        cg.commit();
        container.instanceServiceContainer.selectionService.setSelectedElements(sel);
      } else if (elBefore == null) {
        if (posDrag == 0)
          return;
        const sel = [...container.instanceServiceContainer.selectionService.selectedElements];
        let cg = items[0].openGroup('move in flexbox');
        if (items[0].parent)
          items[0].remove();
        if (style.flexDirection == 'column-reverse')
          container.insertChild(items[0]);
        else
          container.insertChild(items[0], 0);
        cg.commit();
        container.instanceServiceContainer.selectionService.setSelectedElements(sel);
      }
    }

    (<DesignerCanvas>designerCanvas).extensionManager.refreshAllExtensions([container]);
  }

  finishPlace(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
  }

  moveElements(designItems: IDesignItem[], position: IPoint, absolute: boolean) {
  }
}
