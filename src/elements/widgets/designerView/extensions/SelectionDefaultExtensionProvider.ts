import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { SelectionDefaultExtension } from "./SelectionDefaultExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class SelectionDefaultExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new SelectionDefaultExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-selection { stroke: #3899ec; fill: transparent; stroke-width: 2; }
  `;
}