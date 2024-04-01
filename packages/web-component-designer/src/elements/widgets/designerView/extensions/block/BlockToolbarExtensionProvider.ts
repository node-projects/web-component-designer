import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { BlockToolbarExtension } from './BlockToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';
import { css } from '@node-projects/base-custom-webcomponent';

export class BlockToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType === NodeType.Element) {
      const d = getComputedStyle(designItem.element).display;
      return d === 'block' || d === 'inline'
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new BlockToolbarExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
  node-projects-image-button-list-selector img {
    height: 16px;
    border: 1px solid black;
    border-radius: 4px;
    box-sizing: border-box;
    pointer-events: auto;
    cursor: pointer;
  }
  node-projects-image-button-list-selector img:hover {
    background: lightgray;
  }
  node-projects-image-button-list-selector img:active {
    translate: 1px 1px
  }
  `;
}