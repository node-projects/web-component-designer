import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { css } from '@node-projects/base-custom-webcomponent';
import { NodeType } from '../../../../item/NodeType.js';
import { GridChildToolbarExtension } from './GridChildToolbarExtension.js';

export class GridChildToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType === NodeType.Element && getComputedStyle(designItem.parent.element).display === 'grid')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridChildToolbarExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-toolbar-container { overflow: visible }
    .svg-toolbar-container div { padding: 5px; display: flex; gap: 2px; background: white; border-radius: 4px; box-shadow: 0 2px 10px 0 rgba(19,23,32,.2); align-items: center; }
  `;
}