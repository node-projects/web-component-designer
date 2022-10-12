import { IContextMenuItem } from "../../../../helper/contextMenu/IContextMenuItem";
import { DesignItem } from "../../../../item/DesignItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class MultipleItemsSelectedContextMenu implements IContextMenuExtension {

  public orderIndex: number = 60;

  public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (designItem.instanceServiceContainer.selectionService.selectedElements.length > 1) {
      return true;
    }
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'wrap in',
        children: [
          {
            title: 'div',
            action: () => {
              const grp = designItem.openGroup("wrap in Div");
              let elements = designItem.instanceServiceContainer.selectionService.selectedElements;
              let div = document.createElement('div');
              const divDesignItem = DesignItem.createDesignItemFromInstance(div, designItem.serviceContainer, designItem.instanceServiceContainer);
              designItem.insertAdjacentElement(divDesignItem, 'beforebegin');
              let offset = 10;
              let minX = Number.MAX_VALUE;
              let minY = Number.MAX_VALUE;
              let maxX = 0;
              let maxY = 0;
              for (let e of elements) {
                let rect = designerCanvas.getNormalizedElementCoordinates(e.element);
                if (rect.x < minX)
                  minX = rect.x;
                if (rect.y < minY)
                  minY = rect.y;
                if (rect.x + rect.width > maxX)
                  maxX = rect.x + rect.width;
                if (rect.y + rect.height > maxY)
                  maxY = rect.y + rect.height;
              }
              for (let e of elements) {
                let rect = designerCanvas.getNormalizedElementCoordinates(e.element);
                e.remove();
                e.setStyle('left', (rect.x - minX + offset).toString() + 'px');
                e.setStyle('top', (rect.y - minY + offset).toString() + 'px');
                divDesignItem.insertChild(e);
              }
              divDesignItem.setStyle('position', 'absolute');
              divDesignItem.setStyle('left', (minX - offset).toString() + 'px');
              divDesignItem.setStyle('top', (minY - offset).toString() + 'px');
              divDesignItem.setStyle('width', (maxX - minX + 2 * offset).toString() + 'px');
              divDesignItem.setStyle('height', (maxY - minY + 2 * offset).toString() + 'px');
              grp.commit();
              designItem.instanceServiceContainer.selectionService.setSelectedElements([divDesignItem]);
            }
          }
        ]
      }
    ]
  }
}