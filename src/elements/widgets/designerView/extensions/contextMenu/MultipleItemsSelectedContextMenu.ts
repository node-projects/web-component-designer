import { IContextMenuItem } from "../../../../helper/contextMenu/IContextMenuItem";
import { switchContainer } from "../../../../helper/SwitchContainerHelper";
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
              let newContainer = document.createElement('div');
              const newContainerDesignItem = DesignItem.createDesignItemFromInstance(newContainer, designItem.serviceContainer, designItem.instanceServiceContainer);

              elements[0].insertAdjacentElement(newContainerDesignItem, 'beforebegin');
              switchContainer(elements, newContainerDesignItem, true, 10);

              grp.commit();
              designItem.instanceServiceContainer.selectionService.setSelectedElements([newContainerDesignItem]);
            }
          }
        ]
      }
    ]
  }
}