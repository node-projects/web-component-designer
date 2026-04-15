import { css } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { ProjectiveTransformExtension } from './ProjectiveTransformExtension.js';

export class ProjectiveTransformExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designerCanvas.readOnly) {
      return false;
    }
    if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement) {
      return false;
    }
    return !designItem.isRootItem;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new ProjectiveTransformExtension(extensionManager, designerCanvas, designItem);
  }

  static readonly style = css`
    .svg-primary-projective-handle { stroke: #3899ec; fill: white; stroke-width: 1; pointer-events: auto; }
    .svg-primary-projective-handle-cross { stroke: #3899ec; fill: none; stroke-width: 1; stroke-linecap: round; pointer-events: none; }
    .svg-primary-projective-outline { stroke: #3899ec; fill: none; stroke-width: 1; stroke-dasharray: 4 2; }
  `;
}