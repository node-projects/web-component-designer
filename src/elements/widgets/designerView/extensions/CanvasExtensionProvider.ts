import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { CanvasExtension } from './CanvasExtension';

export class CanvasExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean {
    if (getComputedStyle((<HTMLElement>designItem.element)).display == 'block')
      return true;
    return false;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new CanvasExtension(designerView, designItem);
  }
}