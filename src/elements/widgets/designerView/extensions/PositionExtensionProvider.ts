import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PositionExtension } from "./PositionExtension";
import { IExtensionManager } from "./IExtensionManger";

export class PositionExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    const cs = getComputedStyle((<HTMLElement>designItem.element));
    if (cs.position === 'relative' || cs.position === 'absolute')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView,  designItem: IDesignItem): IDesignerExtension {
    return new PositionExtension(extensionManager, designerView, designItem);
  }
}