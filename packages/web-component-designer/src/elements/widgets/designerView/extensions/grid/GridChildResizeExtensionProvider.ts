import { css } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../../../item/IDesignItem.js";
import { NodeType } from "../../../../item/NodeType.js";
import { IDesignerCanvas } from "../../IDesignerCanvas.js";
import { IDesignerExtension } from "../IDesignerExtension.js";
import { IDesignerExtensionProvider } from "../IDesignerExtensionProvider.js";
import { IExtensionManager } from "../IExtensionManger.js";
import { GridChildResizeExtension } from "./GridChildResizeExtension.js";

export class GridChildResizeExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.nodeType === NodeType.Element && designItem.parent?.nodeType === NodeType.Element && getComputedStyle(designItem.parent.element).display === 'grid')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridChildResizeExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-grid-resizer { stroke: #3899ec; fill: white; pointer-events: auto; }
  `;
}