import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { PositionExtension } from "./PositionExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class PositionExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    const cs = getComputedStyle((<HTMLElement>designItem.element));
    if (cs.position === 'relative' || cs.position === 'absolute')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new PositionExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-position-text { text-anchor: middle; alignment-baseline: central; }
  `;
}