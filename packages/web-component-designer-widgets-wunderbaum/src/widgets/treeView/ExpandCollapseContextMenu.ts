import { ContextmenuInitiator, IContextMenuExtension, IContextMenuItem, IDesignItem, IDesignerCanvas } from "@node-projects/web-component-designer";
import { TreeViewExtended } from "./treeViewExtended.js";

export class ExpandCollapseContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (initiator == 'treeView') {
      return true
    }
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator, provider: TreeViewExtended): IContextMenuItem[] {
    return [
      {
        title: 'collapse children', icon: `<img src="${new URL('../../../assets/icons/collapse.svg', import.meta.url)}">`, action: () => {
          provider.collapseChildren(designItem)
        }
      },
      {
        title: 'expand children', icon: `<img src="${new URL('../../../assets/icons/expand.svg', import.meta.url)}">`, action: () => {
          provider.expandChildren(designItem)
        }
      },
    ]
  }
}