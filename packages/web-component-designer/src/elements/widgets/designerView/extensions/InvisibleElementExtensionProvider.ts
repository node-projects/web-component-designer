import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { InvisibleElementExtension as InvisibleElementExtension } from './InvisibleElementExtension.js';
import { css } from "@node-projects/base-custom-webcomponent";

export const invisibleElementExtensionShowOverlayOptionName = 'invisibleElementExtensionShowOverlay';

export class InvisibleElementExtensionProvider implements IDesignerExtensionProvider {

  elementFilter: (designItem: IDesignItem) => boolean;

  constructor(elementFilter: (designItem: IDesignItem) => boolean = (d) => d.name == 'div' && window.getComputedStyle(d.element).display != 'inline') {
    this.elementFilter = elementFilter;
  }

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designerCanvas.instanceServiceContainer.designContext.extensionOptions[invisibleElementExtensionShowOverlayOptionName] !== false) {
      if (this.elementFilter(designItem)) {
        const st = window.getComputedStyle(designItem.element);
        return st.backgroundColor == 'rgba(0, 0, 0, 0)' && st.borderStyle == 'none'
      }
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new InvisibleElementExtension(extensionManager, designerCanvas, designItem);
  }

  static readonly style = css`
    .svg-invisible-div { stroke: lightgray; fill: transparent; stroke-width: 1;
  `;
}