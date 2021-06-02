import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";

export interface IContextMenuExtension {
  shouldProvideContextmenu(designerView: IDesignerView, designItem: IDesignItem);
  provideContextMenuItems(designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[];
}