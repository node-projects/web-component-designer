import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItemTmp";
import { DesignItem } from "../../../../item/DesignItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class ItemsBelowContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return initiator == 'designer';
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {

    const lstItems = designerCanvas.elementsFromPoint(event.x, event.y);
    if (lstItems.length > 0) {
      return [{ title: 'items below', children: [...lstItems.map(x => ({ title: 'select: ' + x.localName + (x.id ? ' (' + x.id + ')' : ''), action: () => this._select(designerCanvas, x) }))] }];
    }
    return [];
  }
  private _select(designerView: IDesignerCanvas, element: Element) {
    const item = DesignItem.GetOrCreateDesignItem(element, designerView.serviceContainer, designerView.instanceServiceContainer);
    designerView.instanceServiceContainer.selectionService.setSelectedElements([item]);
  }


}