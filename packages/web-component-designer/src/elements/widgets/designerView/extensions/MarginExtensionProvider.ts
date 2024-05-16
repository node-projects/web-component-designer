import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { MarginExtension } from './MarginExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { NodeType } from '../../../item/NodeType.js';

export class MarginExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType == NodeType.Element)
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new MarginExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-margin { fill: #ff944766; fill-rule: evenodd; }
  `;
}