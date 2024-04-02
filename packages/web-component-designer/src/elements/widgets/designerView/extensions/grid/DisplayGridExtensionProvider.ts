import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { DisplayGridExtension } from './DisplayGridExtension.js';

export const gridExtensionShowOverlayOptionName = 'gridExtensionShowOverlay';

export class DisplayGridExtensionProvider implements IDesignerExtensionProvider {

  gridColor: string;
  gridFillColor: string;

  constructor(gridColor: string = 'orange', gridFillColor = '#ff944722') {
    this.gridColor = gridColor;
    this.gridFillColor = gridFillColor;
  }

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'grid' || display == 'inline-grid')
      return designerCanvas.instanceServiceContainer.designContext.extensionOptions[gridExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new DisplayGridExtension(extensionManager, designerCanvas, designItem, this.gridColor, this.gridFillColor);
  }

  readonly style = css`
    .svg-grid { stroke: var(--svg-grid-stroke-color); stroke-dasharray: 5; fill: var(--svg-grid-fill-color); }
    .svg-grid-current-cell { stroke: var(--svg-grid-stroke-color); stroke-dasharray: 5; fill: #e3ff4722; }
    .svg-grid-area { font-size: 8px; }
    .svg-grid-gap { stroke: var(--svg-grid-stroke-color); stroke-dasharray: 5; fill: #0000ff22; }
    .svg-grid-header { fill: var(--svg-grid-fill-color); stroke: var(--svg-grid-stroke-color); }
    .svg-grid-plus-sign { stroke: black; }
  `;
}