import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';
import { DraggableToolWindow } from '../../tools/toolBar/popups/DraggableToolWindow.js';
import { TransformToolPopup } from '../../tools/toolBar/popups/TransformToolPopup.js';
import { BoxShadowEditorWindow } from '../../tools/toolBar/popups/BoxShadowEditorWindow.js';
import { TextShadowEditorWindow } from '../../tools/toolBar/popups/TextShadowEditorWindow.js';
import { GradientEditorWindow } from '../../tools/toolBar/popups/GradientEditorWindow.js';
import { BorderRadiusEditorWindow } from '../../tools/toolBar/popups/BorderRadiusEditorWindow.js';

export class ToolWindowsContextMenu implements IContextMenuExtension {
  shouldProvideContextmenu(_event: MouseEvent, _designerCanvas: IDesignerCanvas, _designItem: IDesignItem, _initiator: ContextmenuInitiator): boolean {
    return true;
  }

  provideContextMenuItems(_event: MouseEvent, designerCanvas: IDesignerCanvas, _designItem: IDesignItem, _initiator: ContextmenuInitiator): IContextMenuItem[] {
    return [{
      title: 'tool windows',
      children: [
        {
          title: 'transform',
          action: () => {
            const win = new TransformToolPopup(designerCanvas);
            DraggableToolWindow.showWindow(win);
          }
        },
        {
          title: 'box shadow editor',
          action: () => {
            const win = new BoxShadowEditorWindow(designerCanvas);
            DraggableToolWindow.showWindow(win);
          }
        },
        {
          title: 'text shadow editor',
          action: () => {
            const win = new TextShadowEditorWindow(designerCanvas);
            DraggableToolWindow.showWindow(win);
          }
        },
        {
          title: 'gradient editor',
          action: () => {
            const win = new GradientEditorWindow(designerCanvas);
            DraggableToolWindow.showWindow(win);
          }
        },
        {
          title: 'border radius editor',
          action: () => {
            const win = new BorderRadiusEditorWindow(designerCanvas);
            DraggableToolWindow.showWindow(win);
          }
        },
      ]
    }];
  }
}
