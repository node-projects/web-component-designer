import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class CopyPasteContextMenu implements IContextMenuExtension{
  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'copy', action: () => { designerView.executeCommand({ type: CommandType.copy }); } },
      { title: 'cut', action: () => { designerView.executeCommand({ type: CommandType.cut }); } },
      { title: 'paste', action: () => { designerView.executeCommand({ type: CommandType.paste }); } },
      { title: 'delete', action: () => { designerView.executeCommand({ type: CommandType.delete }); } },
      { title: '-' }
    ]
  }
}