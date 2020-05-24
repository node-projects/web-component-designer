import { IContextMenuItem } from "./IContextmenuItem";

export class ContextMenuHelper {
  static addContextMenu(element: HTMLElement, items: IContextMenuItem[]) {
    element.oncontextmenu = () => {
      return false;
    }
  }
}