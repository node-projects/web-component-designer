import { IDesignerExtensionProvider } from "../IDesignerExtensionProvider";
import { IDesignItem } from "../../../../item/IDesignItem";
import { IDesignerView } from "../../IDesignerView";
import { IDesignerExtension } from "../IDesignerExtension";
import { IExtensionManager } from "../IExtensionManger";
import { EditTextExtension } from "./EditTextExtension.js";

export class EditTextExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): boolean {
    if (designItem.name === 'button' || designItem.name === 'input')
      return false;
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new EditTextExtension(extensionManager, designerView, designItem);
  }
}