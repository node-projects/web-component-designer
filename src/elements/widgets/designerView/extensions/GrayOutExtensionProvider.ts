import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { GrayOutExtension } from "./GrayOutExtension";
import { css } from "@node-projects/base-custom-webcomponent";

export class GrayOutExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new GrayOutExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-gray-out { stroke: transparent; fill: rgba(211, 211, 211, 0.8); pointer-events: none }
  `;  
}