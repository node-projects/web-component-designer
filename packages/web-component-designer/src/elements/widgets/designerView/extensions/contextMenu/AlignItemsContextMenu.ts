import { CommandType } from '../../../../../commandHandling/CommandType.js';
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class AlignItemsContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (designItem?.instanceServiceContainer.selectionService.selectedElements.length > 1) {
      return !designItem?.isRootItem && designItem?.nodeType == NodeType.Element;
    }
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: 'align left', icon: `<img src="${new URL('../../../../../../assets/icons/alignHorizontalLeft.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeLeft }); } },
      { title: 'align center', icon: `<img src="${new URL('../../../../../../assets/icons/alignHorizontalCenter.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeCenter }); } },
      { title: 'align right', icon: `<img src="${new URL('../../../../../../assets/icons/alignHorizontalRight.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeRight }); } },
      { title: 'distribute horizontal', icon: `<img src="${new URL('../../../../../../assets/icons/horizontalDistribute.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.distributeHorizontal }); } },
      { title: 'align top', icon: `<img src="${new URL('../../../../../../assets/icons/alignVerticalTop.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeTop }); } },
      { title: 'align middle', icon: `<img src="${new URL('../../../../../../assets/icons/alignVerticalCenter.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeMiddle }); } },
      { title: 'align bottom', icon: `<img src="${new URL('../../../../../../assets/icons/alignVerticalBottom.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.arrangeBottom }); } },
      { title: 'distribute vertical', icon: `<img src="${new URL('../../../../../../assets/icons/verticalDistribute.svg', import.meta.url)}">`, action: () => { designerView.executeCommand({ type: CommandType.distributeVertical }); } },
    ]
  }
}