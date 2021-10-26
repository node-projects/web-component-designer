import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { CanvasExtension } from './CanvasExtension';
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class CanvasExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (getComputedStyle((<HTMLElement>designItem.element)).display == 'block')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new CanvasExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-margin { fill: #ff944722; }
  `;      
}