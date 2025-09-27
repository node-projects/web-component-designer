import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';
import { assetsPath } from '../../../../../Constants.js';

export class RotateLeftAndRight implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'rotate right', icon: `<img src="${assetsPath + 'icons/rotateRight.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.rotateClockwise }); }, shortCut: 'Ctrl + R' },
      { title: 'rotate left', icon: `<img src="${assetsPath + 'icons/rotateLeft.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.rotateCounterClockwise }); }, shortCut: 'Ctrl + Shift + R' }
    ]
  }
}