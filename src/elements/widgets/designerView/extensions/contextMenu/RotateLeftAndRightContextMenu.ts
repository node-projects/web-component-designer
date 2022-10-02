import { CommandType } from "../../../../../commandHandling/CommandType";
import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItem";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class RotateLeftAndRight implements IContextMenuExtension{

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return !designItem.isRootItem;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
        { title: 'rotate right', action: () => {designerView.executeCommand({type: CommandType.rotateClockwise});}, shortCut: 'Ctrl + R' },
        { title: 'rotate left', action: () => {designerView.executeCommand({type: CommandType.rotateCounterClockwise});}, shortCut: 'Ctrl + Shift + R' }  
    ]
  }
}