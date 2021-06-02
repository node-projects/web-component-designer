import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { IContextMenuExtension } from "./IContextMenuExtension";

export class CopyPasteContextMenu implements IContextMenuExtension{
  public shouldProvideContextmenu(designerView: IDesignerView, designItem: IDesignItem) {
    return true;
  }

  public provideContextMenuItems(designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'copy', action: () => { designerView.executeCommand({ type: CommandType.copy }); } },
      { title: 'cut', action: () => { designerView.executeCommand({ type: CommandType.cut }); } },
      { title: 'paste', action: () => { designerView.executeCommand({ type: CommandType.paste }); } },
      { title: '-' },
      { title: 'delete', action: () => { designerView.executeCommand({ type: CommandType.delete }); } },
      { title: '-' }
    ]
  }
}