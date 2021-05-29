import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { IContextMenuItem } from "./IContextMenuItem";

export interface IContextMenuExtension {
  shouldProvideContextmenu(designerView: IDesignerView, designItem: IDesignItem);
  provideContextMenuItems(designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[];
}