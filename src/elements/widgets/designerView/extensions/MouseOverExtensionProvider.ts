import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { MouseOverExtension } from "./MouseOverExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class MouseOverExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new MouseOverExtension(extensionManager, designerView, designItem);
  }
  
  readonly style = css`
    .svg-hover { stroke: #90caf9; fill: none; }
  `;    
}