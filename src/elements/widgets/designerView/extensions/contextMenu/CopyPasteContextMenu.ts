import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

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