import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { AltToEnterContainerExtension } from './AltToEnterContainerExtension';
import { css } from "@node-projects/base-custom-webcomponent";

export class AltToEnterContainerExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new AltToEnterContainerExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-text-enter-container { stroke: none; fill: black; stroke-width: 1; font-weight:800; font-family: monospace; }
  `;
}