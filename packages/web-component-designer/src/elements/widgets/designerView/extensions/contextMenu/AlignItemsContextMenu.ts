import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';
import { assetsPath } from '../../../../../Constants.js';

export class AlignItemsContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (designItem?.instanceServiceContainer.selectionService.selectedElements.length > 1) {
      return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
    }
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'align left', icon: `<img src="${assetsPath + 'icons/alignHorizontalLeft.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeLeft }); } },
      { title: 'align center', icon: `<img src="${assetsPath + 'icons/alignHorizontalCenter.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeCenter }); } },
      { title: 'align right', icon: `<img src="${assetsPath + 'icons/alignHorizontalRight.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeRight }); } },
      { title: 'distribute horizontal', icon: `<img src="${assetsPath + 'icons/horizontalDistribute.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.distributeHorizontal }); } },
      { title: 'align top', icon: `<img src="${assetsPath + 'icons/alignVerticalTop.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeTop }); } },
      { title: 'align middle', icon: `<img src="${assetsPath + 'icons/alignVerticalCenter.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeMiddle }); } },
      { title: 'align bottom', icon: `<img src="${assetsPath + 'icons/alignVerticalBottom.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeBottom }); } },
      { title: 'distribute vertical', icon: `<img src="${assetsPath + 'icons/verticalDistribute.svg'}">`, action: () => { designerView.executeCommand({ type: CommandType.distributeVertical }); } },
    ]
  }
}