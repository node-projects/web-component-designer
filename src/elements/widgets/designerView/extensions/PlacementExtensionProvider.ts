import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";
import { PlacementExtension } from "./PlacementExtension";

export class PlacementExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas,  designItem: IDesignItem): IDesignerExtension {
    return new PlacementExtension(extensionManager, designerView, designItem);
  }
  
  readonly style = css`
    .svg-hover { stroke: #90caf9; fill: none; }
  `;    
}