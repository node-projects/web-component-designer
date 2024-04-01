import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { BlockToolbarExtension } from './BlockToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';

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
}