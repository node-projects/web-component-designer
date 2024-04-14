import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { NodeType } from '../../../../item/NodeType.js';
import { GridChildToolbarExtension } from './GridChildToolbarExtension.js';
import { basicStackedToolbarExtensionOverlayOptionName } from '../BasicStackedToolbarExtension.js';

export class GridChildToolbarExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType === NodeType.Element && designItem.parent) {
      const cs = designItem.parent?.getComputedStyle();
      if (cs != null && (cs.display === 'grid' || cs.display === 'inline-grid'))
        return designerCanvas.instanceServiceContainer.designContext.extensionOptions[basicStackedToolbarExtensionOverlayOptionName] !== false;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridChildToolbarExtension(extensionManager, designerView, designItem);
  }
}