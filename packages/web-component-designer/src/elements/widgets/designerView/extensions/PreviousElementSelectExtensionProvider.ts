import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { PreviousElementSelectExtension } from './PreviousElementSelectExtension.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class PreviousElementSelectExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !designItem.isRootItem && !(designItem.element instanceof HTMLTemplateElement);
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new PreviousElementSelectExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    rect.svg-previous-select { stroke: none; fill: #3899ec; pointer-events: auto; }
    g.svg-previous-select { fill: white; pointer-events: auto; }
  `;
}