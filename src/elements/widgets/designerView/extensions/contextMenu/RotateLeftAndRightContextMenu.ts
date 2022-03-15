import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class RotateLeftAndRight implements IContextMenuExtension{

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
        { title: 'rotate right', action: () => {designerView.executeCommand({type: CommandType.rotateRight});}, shortCut: 'Ctrl + R' },
        { title: 'rotate left', action: () => {designerView.executeCommand({type: CommandType.rotateLeft});}, shortCut: 'Ctrl + Shift + R' }  
    ]
  }
}