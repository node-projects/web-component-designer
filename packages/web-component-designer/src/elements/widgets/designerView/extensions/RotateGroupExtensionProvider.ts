import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { RotateGroupExtension } from './RotateGroupExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class RotateGroupExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designerCanvas.readOnly)
      return false;
    if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement)
      return false;
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new RotateGroupExtension(extensionManager, designerCanvas, designItem);
  }

  static readonly style = css`
    .svg-primary-rotate { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; cursor: alias; }
    .svg-primary-rotate-line { stroke: #3899ec; fill: #3899ec; stroke-width: 1; }
    .svg-rotate-group-rect { stroke: #3899ec; fill: transparent; stroke-width: 2; stroke-dasharray: 5 3; }
  `;
}
