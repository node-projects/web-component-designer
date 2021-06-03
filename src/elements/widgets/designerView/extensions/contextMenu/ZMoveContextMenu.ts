import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { IContextMenuExtension } from "./IContextMenuExtension";

export class ZMoveContextMenu implements IContextMenuExtension{

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerView, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'to front', action: () => { designerView.executeCommand({ type: CommandType.moveToFront }); } },
      { title: 'move forward', action: () => { designerView.executeCommand({ type: CommandType.moveForward }); } },
      { title: 'move backward', action: () => { designerView.executeCommand({ type: CommandType.moveBackward }); } },
      { title: 'to back', action: () => { designerView.executeCommand({ type: CommandType.moveToBack }); } },
    ]
  }
}