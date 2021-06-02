import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";

export class MultipleItemsSelectedContextMenu {

  public orderIndex: number = 60;

  public shouldProvideContextmenu(designerView: IDesignerView, designItem: IDesignItem) {
    if (designItem.instanceServiceContainer.selectionService.selectedElements.length > 1) {
      return true;
    }
    return false;
  }

  public provideContextMenuItems(designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[] {
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