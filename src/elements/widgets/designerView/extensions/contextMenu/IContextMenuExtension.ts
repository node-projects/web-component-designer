import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';

export type ContextmenuInitiator =  'designer' | 'treeView' | 'other';

export interface IContextMenuExtension {
  shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator);
  provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[];
}