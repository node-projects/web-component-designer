import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { MouseOverExtension } from './MouseOverExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class MouseOverExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new MouseOverExtension(extensionManager, designerView, designItem);
  }
  
  readonly style = css`
    .svg-hover { stroke: #90caf9; fill: none; }
  `;    
}