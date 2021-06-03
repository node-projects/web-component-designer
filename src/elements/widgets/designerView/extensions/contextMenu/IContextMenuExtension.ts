import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";

export interface IContextMenuExtension {
  shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem);
  provideContextMenuItems(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[];
}