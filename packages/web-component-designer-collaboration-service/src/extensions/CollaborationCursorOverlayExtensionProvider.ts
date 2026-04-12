import { css } from '@node-projects/base-custom-webcomponent';
import { CollaborationCursorOverlayExtension } from './CollaborationCursorOverlayExtension.js';
import { IDesignerExtensionProvider, IExtensionManager, IDesignerCanvas, IDesignItem, IDesignerExtension } from '@node-projects/web-component-designer';

export class CollaborationCursorOverlayExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new CollaborationCursorOverlayExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-collaboration-cursor,
    .svg-collaboration-cursor-hotspot,
    .svg-collaboration-cursor-label {
      pointer-events: none;
    }

    .svg-collaboration-cursor-label {
      font-size: 11px;
    }
  `;
}