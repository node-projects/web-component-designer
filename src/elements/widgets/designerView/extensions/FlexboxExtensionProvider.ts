import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { FlexboxExtension } from './FlexboxExtension.js';

export const flexboxExtensionShowOverlayOptionName = 'flexboxExtensionShowOverlay';

export class FlexboxExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'flex' || display == 'inline-flex')
      return designerCanvas.instanceServiceContainer.designContext.extensionOptions[flexboxExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new FlexboxExtension(extensionManager, designerCanvas, designItem);
  }

  readonly style = css`
    .svg-flexbox { stroke: orange; fill: #9a47ff22; }
  `;
}