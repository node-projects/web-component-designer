import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { PositionExtension } from './PositionExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class PositionExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (!designItem?.parent)
      return false;
    const cs = getComputedStyle((<HTMLElement>designItem.element));
    if (cs.position === 'relative' || cs.position === 'absolute')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new PositionExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-position-text { text-anchor: middle; alignment-baseline: central; }
  `;
}