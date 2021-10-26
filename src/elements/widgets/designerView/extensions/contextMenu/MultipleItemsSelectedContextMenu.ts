import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { IContextMenuExtension } from "./IContextMenuExtension";

export class MultipleItemsSelectedContextMenu implements IContextMenuExtension {

  public orderIndex: number = 60;

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem) {
    if (designItem.instanceServiceContainer.selectionService.selectedElements.length > 1) {
      return true;
    }
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'wrap in',
        children: [
          {
            title: 'div',
            action: () => { }
          }
        ]
      }
    ]
  }
}