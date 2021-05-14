import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { ExtensionType } from './ExtensionType';
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { GridExtension } from './GridExtension';

export class GridExtensionProvider implements IDesignerExtensionProvider {

  readonly extensionType = ExtensionType.PrimarySelectionContainer;

  shouldExtend(designItem: IDesignItem): boolean {
    if (getComputedStyle((<HTMLElement>designItem.element)).display == 'grid')
      return true;
    return false;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new GridExtension(designerView, designItem);
  }
}