import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class ZMoveContextMenu implements IContextMenuExtension{

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'to front', action: () => { designerView.executeCommand({ type: CommandType.moveToFront }); } },
      { title: 'move forward', action: () => { designerView.executeCommand({ type: CommandType.moveForward }); } },
      { title: 'move backward', action: () => { designerView.executeCommand({ type: CommandType.moveBackward }); } },
      { title: 'to back', action: () => { designerView.executeCommand({ type: CommandType.moveToBack }); } },
    ]
  }
}