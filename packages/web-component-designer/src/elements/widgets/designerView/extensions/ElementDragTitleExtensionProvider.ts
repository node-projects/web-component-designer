import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { ElementDragTitleExtension } from './ElementDragTitleExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class ElementDragTitleExtensionProvider implements IDesignerExtensionProvider {

  private _createTitleText: (designItem: IDesignItem) => string;
  
  constructor(createTitleText?: (designItem: IDesignItem) => string) {
    this._createTitleText = createTitleText;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !designItem.isRootItem && !(designItem.element instanceof HTMLTemplateElement);
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new ElementDragTitleExtension(extensionManager, designerView, designItem, this._createTitleText);
  }

  static readonly style = css`
    .svg-text-primary { stroke: none; color: white; font-family: monospace; }
  `;
}