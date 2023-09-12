import { IDesignerExtensionProvider, IExtensionManager, IDesignerCanvas, IDesignItem, IDesignerExtension } from "@node-projects/web-component-designer";
import { EditTextWithStyloExtension } from "./EditTextWithStyloExtension.js";
import { css } from "@node-projects/base-custom-webcomponent";

export class EditTextWithStyloExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.name === 'button' || designItem.name === 'input')
      return false;
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new EditTextWithStyloExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
  .svg-transparent { stroke: none; fill: transparent; pointer-events: all; }
`;
}