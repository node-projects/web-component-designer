import { css } from '@node-projects/base-custom-webcomponent';
import { IDesignerExtensionProvider, IExtensionManager, IDesignerCanvas, IDesignItem, IDesignerExtension } from '@node-projects/web-component-designer';
import { CollaborationOverlayExtension } from './CollaborationOverlayExtension.js';

export class CollaborationOverlayExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !designItem.isRootItem && !(designItem.element instanceof HTMLTemplateElement);
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new CollaborationOverlayExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-collaboration-peer {
      stroke-dasharray: 5 3;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }

    .svg-collaboration-comment {
      stroke-dasharray: 2 4;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }

    .svg-collaboration-label,
    .svg-collaboration-comment-label,
    .svg-collaboration-comment-preview {
      font-size: 11px;
      pointer-events: none;
    }
  `;
}