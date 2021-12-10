import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerCanvas } from "../IDesignerCanvas";
import { IDesignerExtension } from "./IDesignerExtension";
import { GridExtension } from './GridExtension';
import { IExtensionManager } from "./IExtensionManger";
import { css } from "@node-projects/base-custom-webcomponent";

export const gridExtensionShowOverlayOptionName = 'gridExtensionShowOverlay';

export class GridExtensionProvider implements IDesignerExtensionProvider {

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (getComputedStyle((<HTMLElement>designItem.element)).display == 'grid')
      return designerView.instanceServiceContainer.designContext.extensionOptions[gridExtensionShowOverlayOptionName] !== false;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new GridExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-grid { stroke: orange; stroke-dasharray: 5; fill: #ff944722; }
    .svg-grid-area { font-size: 8px; }
    .svg-grid-gap { stroke: orange; stroke-dasharray: 5; fill: #0000ff22; }
  `;
}