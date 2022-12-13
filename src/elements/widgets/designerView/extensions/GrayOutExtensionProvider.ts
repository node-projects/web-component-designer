import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { GrayOutExtension } from './GrayOutExtension.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class GrayOutExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new GrayOutExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-gray-out { stroke: transparent; fill: rgba(211, 211, 211, 0.8); pointer-events: none }
  `;  
}