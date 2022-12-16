import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { GridExtension } from './GridExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export const gridExtensionShowOverlayOptionName = 'gridExtensionShowOverlay';

export class GridExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'grid' || display == 'inline-grid')
      return designerCanvas.instanceServiceContainer.designContext.extensionOptions[gridExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridExtension(extensionManager, designerCanvas, designItem);
  }

  readonly style = css`
    .svg-grid { stroke: orange; stroke-dasharray: 5; fill: #ff944722; }
    .svg-grid-area { font-size: 8px; }
    .svg-grid-gap { stroke: orange; stroke-dasharray: 5; fill: #0000ff22; }
    .svg-grid-resizer { fill: white; stroke: #3899ec }
  `;
}