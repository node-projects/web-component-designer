import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { AbstractExtensionBase } from "./AbstractExtensionBase.js";

export abstract class AbstractExtension extends AbstractExtensionBase implements IDesignerExtension {
  protected extendedItem: IDesignItem;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView)
    this.extendedItem = extendedItem;
  }

  abstract extend();
  abstract refresh();
  abstract dispose();
}