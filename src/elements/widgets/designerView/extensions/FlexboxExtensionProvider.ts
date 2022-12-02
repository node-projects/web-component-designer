import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";
import { FlexboxExtension } from "./FlexboxExtension";

export class FlexboxExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    const display = getComputedStyle((<HTMLElement>designItem.element)).display;
    if (display == 'flex' || display == 'inline-flex')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new FlexboxExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-flexbox { stroke: orange; fill: #9a47ff22; }
  `;
}