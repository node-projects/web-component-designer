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
    if (designItem.nodeType === NodeType.Element && getComputedStyle(designItem.parent.element).display === 'grid')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridChildResizeExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-primary-resizer { stroke: #3899ec; fill: white; pointer-events: all }
  `;
}