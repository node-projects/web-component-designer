import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { AltToEnterContainerExtension } from './AltToEnterContainerExtension.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class AltToEnterContainerExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new AltToEnterContainerExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-text-enter-container { stroke: none; fill: black; stroke-width: 1; font-weight:800; font-family: monospace; }
  `;
}