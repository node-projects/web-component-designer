import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { GridExtension } from './GridExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export const gridExtensionShowOverlayOptionName = 'gridExtensionShowOverlay';

export class GridExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'grid' || display == 'inline-grid')
      return designerView.instanceServiceContainer.designContext.extensionOptions[gridExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-grid { stroke: orange; stroke-dasharray: 5; fill: #ff944722; }
    .svg-grid-area { font-size: 8px; }
    .svg-grid-gap { stroke: orange; stroke-dasharray: 5; fill: #0000ff22; }
    .svg-grid-reziser { background: white; border: 1px solid black; }
  `;
}