import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItemTmp";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class CopyPasteContextMenu implements IContextMenuExtension {
  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'copy', action: () => { designerView.executeCommand({ type: CommandType.copy }); }, shortCut: 'Ctrl + C' },
      { title: 'cut', action: () => { designerView.executeCommand({ type: CommandType.cut }); }, shortCut: 'Ctrl + X' },
      { title: 'paste', action: () => { designerView.executeCommand({ type: CommandType.paste }); }, shortCut: 'Ctrl + V' },
      { title: 'delete', action: () => { designerView.executeCommand({ type: CommandType.delete }); }, shortCut: 'Del' },
    ]
  }
}