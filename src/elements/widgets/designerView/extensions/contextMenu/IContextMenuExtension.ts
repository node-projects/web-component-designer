import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItemTmp";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";

export type ContextmenuInitiator =  'designer' | 'treeView' | 'other';

export interface IContextMenuExtension {
  shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator);
  provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[];
}