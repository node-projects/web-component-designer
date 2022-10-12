import { IContextMenuItem } from "../../../../helper/contextMenu/IContextmenuItemTmp";
import { createPathD } from "../../../../helper/PathDataPolyfill";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerCanvas } from "../../IDesignerCanvas";
import { ContextmenuInitiator, IContextMenuExtension } from "./IContextMenuExtension";

export class PathContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (designItem.element instanceof SVGPathElement)
      return true;
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    const pathdata = (<SVGGraphicsElement>designItem.node).getPathData({ normalize: true });
    const items: IContextMenuItem[] = [];
    const lastType = pathdata[pathdata.length - 1].type;
    items.push({ title: '-' });
    if (lastType == 'z' || lastType == 'Z') {
      items.push({
        title: 'open path ', action: () => {
          pathdata.splice(pathdata.length - 1, 1);
          designItem.setAttribute('d', createPathD(pathdata));
        }
      });
    }
    else {
      items.push({
        title: 'close path ', action: () => {
          pathdata.push(<any>{ type: 'Z' });
          designItem.setAttribute('d', createPathD(pathdata));
        }
      });
    }

    return items;
  }
}