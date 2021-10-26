import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { InvisibleDivExtension } from "./InvisibleDivExtension";
import { css } from "@node-projects/base-custom-webcomponent";

export class InvisibleDivExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.name == 'div') {
      const st = window.getComputedStyle(designItem.element);
      return st.backgroundColor == 'rgba(0, 0, 0, 0)' && st.borderStyle == 'none'
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new InvisibleDivExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-invisible-div { stroke: lightgray; fill: transparent; stroke-width: 1;
  `;
}