import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { ResizeExtension } from "./ResizeExtension";
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export class ResizeExtensionProvider implements IDesignerExtensionProvider {
  private resizeAllSelected: boolean;

  constructor(resizeAllSelected: boolean = false) {
    this.resizeAllSelected = resizeAllSelected;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new ResizeExtension(extensionManager, designerView, designItem, this.resizeAllSelected);
  }
  
  readonly style = css`
    .svg-primary-resizer { stroke: #3899ec; fill: white; pointer-events: all }
  `;
}