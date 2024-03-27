import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { MultipleSelectionRectExtension as MultipleSelectionRectExtension } from './MultipleSelectionRectExtension.js';

export class MultipleSelectionRectExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new MultipleSelectionRectExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-multiple-rect-selection { stroke: #909090; stroke-dasharray: 3; fill: transparent; stroke-width: 2; /*pointer-events: all;*/ }
  `;
}