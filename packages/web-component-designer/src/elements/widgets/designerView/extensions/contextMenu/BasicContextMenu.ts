import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';


type BasicContextMenuItem = Omit<IContextMenuItem, 'action'> & { action?: (event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) => void };
export class BasicContextMenu implements IContextMenuExtension {
    private _item: BasicContextMenuItem;
    private _shouldProvide: (event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) => boolean;

    constructor(item: BasicContextMenuItem, shouldProvide?: (event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) => boolean) {
        this._item = item;
        this._shouldProvide = shouldProvide || (() => true);
    }
    public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
        return this._shouldProvide(event, designerCanvas, designItem, initiator);
    }

    public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator): IContextMenuItem[] {
        return [{ ...this._item, action: (e) => this._item.action?.(e, designerCanvas, designItem, initiator)}];
    }
}