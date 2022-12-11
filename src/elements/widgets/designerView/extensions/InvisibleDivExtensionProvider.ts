import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { InvisibleDivExtension } from './InvisibleDivExtension.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class InvisibleDivExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.name == 'div') {
      const st = window.getComputedStyle(designItem.element);
      return st.backgroundColor == 'rgba(0, 0, 0, 0)' && st.borderStyle == 'none'
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new InvisibleDivExtension(extensionManager, designerCanvas, designItem);
  }

  readonly style = css`
    .svg-invisible-div { stroke: lightgray; fill: transparent; stroke-width: 1;
  `;
}