import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';


export class JumpToElementContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return true;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'jump to', action: () => {          
          const coord = designerCanvas.getNormalizedElementCoordinates(designItem.element);
          designerCanvas.jumpPoint({x: coord.x + coord.width / 2, y: coord.y + coord.height / 2 });
        }
      },
    ]
  }
}