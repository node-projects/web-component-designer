import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { SkewExtension } from './SkewExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { css } from '@node-projects/base-custom-webcomponent';

export class SkewExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designerCanvas.readOnly)
      return false;
    if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement) {
      return false;
    }
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new SkewExtension(extensionManager, designerCanvas, designItem);
  }

  static readonly style = css`
    .svg-primary-skew { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; }
    .svg-primary-skew-line { stroke: #3899ec; fill: none; stroke-width: 1; }
  `;
}