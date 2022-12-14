import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class AddRemoveFromCssGridContextMenu implements IContextMenuExtension {
  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'add row', action: () => {designerView.executeCommand({type: CommandType.addRowToCssGrid});}},
      { title: 'delete row', action: () => {designerView.executeCommand({type: CommandType.deleteRowFromCssGrid});}},
      { title: 'add column', action: () => {designerView.executeCommand({type: CommandType.addColumnToCssGrid});}},
      { title: 'delete column', action: () => {designerView.executeCommand({type: CommandType.deleteColumnFromCssGrid});}},
    ]
  }
}