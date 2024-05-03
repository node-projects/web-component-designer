import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';


export class JumpToElementContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return designItem !== null;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'jump to', icon: `<img src="${new URL('../../../../../../assets/icons/jump.svg', import.meta.url)}">`, action: () => {          
          const coord = designerCanvas.getNormalizedElementCoordinates(designItem.element);
          
          designerCanvas.zoomPoint({x: coord.x + coord.width / 2, y: coord.y + coord.height / 2 }, designerCanvas.zoomFactor);
        }
      },
    ]
  }
}