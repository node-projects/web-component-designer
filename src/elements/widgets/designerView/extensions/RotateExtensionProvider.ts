import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { RotateExtension } from "./RotateExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class RotateExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new RotateExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-primary-rotate { stroke: #3899ec; fill: #3899ec; pointer-events: all }
  `;   
}