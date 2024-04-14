import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { FlexToolbarExtension } from './FlexToolbarExtension.js';
import { NodeType } from '../../../../item/NodeType.js';
import { basicStackedToolbarExtensionOverlayOptionName } from '../BasicStackedToolbarExtension.js';

export class FlexToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType === NodeType.Element) {
      const d = getComputedStyle(designItem.element).display;
      if (d === 'flex' || d === 'inline-flex')
        return designerCanvas.instanceServiceContainer.designContext.extensionOptions[basicStackedToolbarExtensionOverlayOptionName] !== false;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new FlexToolbarExtension(extensionManager, designerView, designItem);
  }
}