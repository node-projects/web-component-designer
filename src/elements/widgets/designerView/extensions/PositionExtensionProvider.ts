import { IDesignerExtensionProvider } from "./IDesignerExtensionProvider";
import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { IDesignerExtension } from "./IDesignerExtension";
import { PositionExtension } from "./PositionExtension";

export class PositionExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(designItem: IDesignItem): boolean {
    const cs = getComputedStyle((<HTMLElement>designItem.element));
    if (cs.position === 'relative' || cs.position === 'absolute')
      return true;
    return false;
  }

  getExtension(designerView: IDesignerView, designItem: IDesignItem): IDesignerExtension {
    return new PositionExtension(designerView, designItem);
  }
}