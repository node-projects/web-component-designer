import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { RotateExtension } from "./RotateExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class RotateExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.element instanceof SVGElement) {
      return false;
    }
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new RotateExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-primary-rotate { stroke: #3899ec; fill: #3899ec; pointer-events: all }
    .svg-rotate-text { text-anchor: middle; alignment-baseline: central; }
  `;   
}