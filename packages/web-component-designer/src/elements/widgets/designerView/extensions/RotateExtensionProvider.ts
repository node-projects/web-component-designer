import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { RotateExtension } from './RotateExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class RotateExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.element instanceof SVGElement) {
      return false;
    }
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new RotateExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-primary-rotate { stroke: #3899ec; fill: #3899ec; pointer-events: all }
    .svg-rotate-text { text-anchor: middle; alignment-baseline: central; }
  `;   
}