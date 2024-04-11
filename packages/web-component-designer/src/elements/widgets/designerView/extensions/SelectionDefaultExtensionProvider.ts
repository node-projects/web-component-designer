import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { SelectionDefaultExtension } from './SelectionDefaultExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { NodeType } from '../../../item/NodeType.js';

export class SelectionDefaultExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !designItem.isRootItem && designItem.nodeType != NodeType.Comment && !(designItem.element instanceof HTMLTemplateElement);
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new SelectionDefaultExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-selection { stroke: #3899ec; fill: transparent; stroke-width: 2; /*pointer-events: all;*/ }
  `;
}