import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { DesignItem } from '../../../../item/DesignItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class ChildrenContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return initiator == 'designer';
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    if (designItem) {
      const lstItems = [...designItem.element.children];
      if (lstItems.length > 0) {
        return [{ title: 'children', children: [...lstItems.map(x => ({ title: 'select: ' + x.localName + (x.id ? ' (#' + x.id + ')' : ''), action: () => this._select(designerCanvas, x) }))] }];
      }
    }
    return [];
  }
  private _select(designerView: IDesignerCanvas, element: Element) {
    const item = DesignItem.GetOrCreateDesignItem(element, element, designerView.serviceContainer, designerView.instanceServiceContainer);
    designerView.instanceServiceContainer.selectionService.setSelectedElements([item]);
  }


}