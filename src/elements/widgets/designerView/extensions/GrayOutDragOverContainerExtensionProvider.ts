import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";
import { GrayOutDragOverContainerExtension } from "./GrayOutDragOverContainerExtension.js";

export class GrayOutDragOverContainerExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new GrayOutDragOverContainerExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-rect-enter-container { stroke: none; fill: #aa00ff2e; }
  `;
}