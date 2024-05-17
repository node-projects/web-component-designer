import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { PlacementExtension } from './PlacementExtension.js';

export class PlacementExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new PlacementExtension(extensionManager, designerView, designItem);
  }
  
  static readonly style = css`
    .svg-placement { stroke: #90caf9; fill: none; }
  `;    
}