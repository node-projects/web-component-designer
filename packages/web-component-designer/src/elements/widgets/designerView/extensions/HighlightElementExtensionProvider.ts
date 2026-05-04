import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { HighlightElementExtension, HighlightElementExtensionOptions } from './HighlightElementExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class HighlightElementExtensionProvider implements IDesignerExtensionProvider {
  private _options: HighlightElementExtensionOptions;

  constructor(options?: HighlightElementExtensionOptions) {
    this._options = options ?? {};
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return !(designItem.element instanceof HTMLTemplateElement);
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new HighlightElementExtension(extensionManager, designerView, designItem, this._options);
  }
  
  static readonly style = css`
    .svg-hover { stroke: #90caf966; fill: none; }
    .svg-hover-fill { stroke: #90caf966; fill: #90caf966; }
  `;    
}