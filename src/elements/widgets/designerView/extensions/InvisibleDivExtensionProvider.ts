import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { IExtensionManager } from "./IExtensionManger";
import { InvisibleDivExtension } from "./InvisibleDivExtension";

export class InvisibleDivExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    if (designItem.name == 'div') {
      const st = window.getComputedStyle(designItem.element);
      return st.backgroundColor == 'rgba(0, 0, 0, 0)' && st.borderStyle == 'none'
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new InvisibleDivExtension(extensionManager, designerView, designItem);
  }
}