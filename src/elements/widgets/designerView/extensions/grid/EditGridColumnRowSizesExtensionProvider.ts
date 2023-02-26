import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { EditGridColumnRowSizesExtension } from './EditGridColumnRowSizesExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { gridExtensionShowOverlayOptionName } from './DisplayGridExtensionProvider.js';

export class EditGridColumnRowSizesExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'grid' || display == 'inline-grid')
      return designerCanvas.instanceServiceContainer.designContext.extensionOptions[gridExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new EditGridColumnRowSizesExtension(extensionManager, designerCanvas, designItem);
  }

  readonly style = css`
    .svg-grid-resizer-v { fill: transparent; cursor: ew-resize; pointer-events: all; }
    .svg-grid-resizer-v:hover { fill: #ff7f5052; }
    .svg-grid-resizer-h { fill: transparent; cursor: ns-resize; pointer-events: all; }
    .svg-grid-resizer-h:hover { fill: #ff7f5052; }
  `;
}