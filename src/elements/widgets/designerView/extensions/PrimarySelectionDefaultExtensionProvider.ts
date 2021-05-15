import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PrimarySelectionDefaultExtension } from "./PrimarySelectionDefaultExtension";

export class PrimarySelectionDefaultExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new PrimarySelectionDefaultExtension(designerView, designItem);
  }
}