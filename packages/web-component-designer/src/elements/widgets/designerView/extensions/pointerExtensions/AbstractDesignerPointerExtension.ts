
import { IDesignItem } from "../../../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../IDesignerCanvas.js";
import { IExtensionManager } from "../IExtensionManger.js";
import { IDesignerPointerExtension } from "./IDesignerPointerExtension.js";
import { AbstractExtensionBase } from '../AbstractExtensionBase.js';

//todo:
//move draw functions to overlay layer
//implement designerpointerextension
//create ruler
export abstract class AbstractDesignerPointerExtension extends AbstractExtensionBase implements IDesignerPointerExtension {
  protected extendedItem: IDesignItem;

  constructor(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas) {
    super(extensionManager, designerCanvas);
  }

  abstract refresh(event: PointerEvent);
  abstract dispose();
}