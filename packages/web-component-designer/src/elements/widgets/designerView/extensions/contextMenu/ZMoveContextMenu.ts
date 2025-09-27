import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';
import { assetsPath } from '../../../../../Constants.js';

export class ZMoveContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'to front', icon: `<img style="rotate: 90deg" src="${assetsPath + 'icons/moveFirst.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.moveToFront }); } },
      { title: 'move forward', icon: `<img style="rotate: 90deg" src="${assetsPath + 'icons/moveLeft.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.moveForward }); } },
      { title: 'move backward', icon: `<img style="rotate: 270deg" src="${assetsPath + 'icons/moveLeft.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.moveBackward }); } },
      { title: 'to back', icon: `<img style="rotate: 270deg" src="${assetsPath + 'icons/moveFirst.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.moveToBack }); } },
    ]
  }
}