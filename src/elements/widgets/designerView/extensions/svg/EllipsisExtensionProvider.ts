import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { EllipsisExtension } from './EllipsisExtension.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';

export class EllipsisExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGEllipseElement) {
      return isVisualSvgElement(designItem.node);
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new EllipsisExtension(extensionManager, designerView, designItem);
  }
}