import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";

export interface IContextMenuExtension {
  shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem);
  provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[];
}