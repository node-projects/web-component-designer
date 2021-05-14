import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { ExtensionType } from './ExtensionType';
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { SelectionDefaultExtension } from "./SelectionDefaultExtension";

export class SelectionDefaultExtensionProvider implements IDesignerExtensionProvider {

  readonly extensionType = ExtensionType.Selection;

  shouldExtend(designItem: IDesignItem): boolean {
    return true;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new SelectionDefaultExtension(designerView, designItem);
  }
}