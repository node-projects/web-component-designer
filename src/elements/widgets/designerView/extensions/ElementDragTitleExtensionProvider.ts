import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { ElementDragTitleExtension } from './ElementDragTitleExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class ElementDragTitleExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new ElementDragTitleExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-text-primary { stroke: none; fill: white; font-family: monospace; }
  `;
}