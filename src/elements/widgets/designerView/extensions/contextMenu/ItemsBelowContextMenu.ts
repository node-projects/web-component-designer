import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { DesignItem } from "../../../../item/DesignItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { IContextMenuExtension } from "./IContextMenuExtension";

export class ItemsBelowContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[] {

    const lstItems = this._searchForItemsBelow(event, designerView);
    if (lstItems.length > 0) {
      //TODO: create a submenu 'select items below...'
      return [{ title: '-' }, ...lstItems.map(x => ({ title: 'select: ' + x.localName + (x.id ? ' (' + x.id + ')' : ''), action: () => this._select(designerView, x) }))];
    }
    return [];
  }
  private _select(designerView: IDesignerView, element: Element) {
    const item = DesignItem.GetOrCreateDesignItem(element, designerView.serviceContainer, designerView.instanceServiceContainer);
    designerView.instanceServiceContainer.selectionService.setSelectedElements([item]);
  }

  private _searchForItemsBelow(event: MouseEvent, designerView: IDesignerView): Element[] {
    const lstEl: HTMLElement[] = [];
    //search for containers below mouse cursor.
    //to do this, we need to disable pointer events for each in a loop and search wich element is there
    let backupPEventsMap: Map<HTMLElement, string> = new Map();
    try {
      let el = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
      backupPEventsMap.set(el, el.style.pointerEvents);
      el.style.pointerEvents = 'none';
      if (el !== designerView.rootDesignItem.element) {
        el = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
        while (el != null) {
          if (el === designerView.rootDesignItem.element)
            break;
          if (el !== <any>designerView.overlayLayer && el.parentElement !== <any>designerView.overlayLayer && el.getRootNode() === designerView.shadowRoot)
            lstEl.push(el);
          backupPEventsMap.set(el, el.style.pointerEvents);
          el.style.pointerEvents = 'none';
          const oldEl = el;
          el = designerView.elementFromPoint(event.x, event.y) as HTMLElement;
          if (oldEl === el)
            break;
        }
      }
    }
    finally {
      for (let e of backupPEventsMap.entries()) {
        e[0].style.pointerEvents = e[1];
      }
    }
    return lstEl;
  }
}