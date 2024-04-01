import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { FlexToolbarExtension } from './FlexToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';

export class FlexToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
      if (designItem.nodeType === NodeType.Element) {
        const d = getComputedStyle(designItem.element).display;
        return d === 'flex' || d === 'inline-flex'
      }
      return false;
    }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new FlexToolbarExtension(extensionManager, designerView, designItem);
  }
}