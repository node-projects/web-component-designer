import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { RotateExtension } from './RotateExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class RotateExtensionProvider implements IDesignerExtensionProvider {
  public type: 'center-top' | 'corners';

  constructor(type: 'center-top' | 'corners' = 'center-top') {
    this.type = type;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement) {
      return false;
    }
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new RotateExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-primary-rotate { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; cursor: alias; }
    .svg-primary-rotate-transparent { fill: transparent; pointer-events: auto; cursor: alias; }
    .svg-primary-rotate-line { stroke: #3899ec; fill: #3899ec; stroke-width: 1; }
  `;
}