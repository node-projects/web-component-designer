import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class ForceCssContextMenu implements IContextMenuExtension {
  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return designItem != null && designItem.nodeType == NodeType.Element;
  }

  public provideContextMenuItems(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      { title: ':hover', action: () => { designItem.cssForceHover = !designItem.cssForceHover }, checked: designItem.cssForceHover },
      { title: ':active', action: () => { designItem.cssForceActive = !designItem.cssForceActive }, checked: designItem.cssForceActive },
      { title: ':visited', action: () => { designItem.cssForceVisited = !designItem.cssForceVisited }, checked: designItem.cssForceVisited },
      { title: ':focus', action: () => { designItem.cssForceFocus = !designItem.cssForceFocus }, checked: designItem.cssForceFocus },
      { title: ':focus-within', action: () => { designItem.cssForceFocusWithin = !designItem.cssForceFocusWithin }, checked: designItem.cssForceFocusWithin },
      { title: ':focus-visible', action: () => { designItem.cssForceFocusVisible = !designItem.cssForceFocusVisible }, checked: designItem.cssForceFocusVisible },
    ]
  }
}