import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';
import { SvgElementExtension } from './SvgElementExtension.js';

export class SvgElementExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof SVGRectElement ||
      designItem.node instanceof SVGLineElement ||
      designItem.node instanceof SVGCircleElement ||
      designItem.node instanceof SVGPathElement) {
      return isVisualSvgElement(designItem.node);
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new SvgElementExtension(extensionManager, designerView, designItem);
  }
}