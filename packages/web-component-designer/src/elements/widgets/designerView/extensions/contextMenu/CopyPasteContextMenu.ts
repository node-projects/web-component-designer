import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';
import basePath from '../../../../../basepath.js'

export class CopyPasteContextMenu implements IContextMenuExtension {
  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'copy', icon: `<img src="${new URL('../assets/icons/copy.svg', basePath)}">`, action: () => { designerView.executeCommand({ type: CommandType.copy }); }, shortCut: 'Ctrl + C', disabled: designItem === null },
      { title: 'cut', icon: `<img src="${new URL('../assets/icons/cut.svg', basePath)}">`, action: () => { designerView.executeCommand({ type: CommandType.cut }); }, shortCut: 'Ctrl + X', disabled: designItem === null },
      { title: 'paste', icon: `<img src="${new URL('../assets/icons/paste.svg', basePath)}">`, action: () => { designerView.executeCommand({ type: CommandType.paste }); }, shortCut: 'Ctrl + V' },
      { title: 'delete', icon: `<img src="${new URL('../assets/icons/delete.svg', basePath)}">`, action: () => { designerView.executeCommand({ type: CommandType.delete }); }, shortCut: 'Del', disabled: designItem === null },
    ]
  }
}