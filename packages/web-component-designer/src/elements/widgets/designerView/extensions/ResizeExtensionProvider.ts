import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { ResizeExtension } from './ResizeExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { NodeType } from "../../../item/NodeType.js";

export class ResizeExtensionProvider implements IDesignerExtensionProvider {
  private resizeAllSelected: boolean;

  constructor(resizeAllSelected: boolean = false) {
    this.resizeAllSelected = resizeAllSelected;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.element instanceof SVGElement || designItem.element instanceof HTMLTemplateElement)
      return false;
    return !designItem.isRootItem && designItem.nodeType == NodeType.Element;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new ResizeExtension(extensionManager, designerView, designItem, this.resizeAllSelected);
  }

  static readonly style = css`
    .svg-primary-resizer { stroke: #3899ec; fill: white; pointer-events: all }
  `;
}