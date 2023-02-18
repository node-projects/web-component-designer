import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';

export class ApplyFirstMachingExtensionProvider implements IDesignerExtensionProvider {

  private extensions: IDesignerExtensionProvider[]
  private extIndex: number;
  public style: CSSStyleSheet[];

  constructor(...extensions: IDesignerExtensionProvider[]) {
    this.extensions = extensions;
    for (let e of extensions) {
      if (e.style) {
        if (!this.style)
          this.style = [];
        if (Array.isArray(e.style))
          this.style.push(...e.style);
        else
          this.style.push(e.style);
      }
    }
  }

  shouldExtend(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): boolean {
    for (this.extIndex = 0; this.extIndex < this.extensions.length; this.extIndex++) {
      if (this.extensions[this.extIndex].shouldExtend(extensionManager, designerCanvas, designItem))
        return true;
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return this.extensions[this.extIndex].getExtension(extensionManager, designerCanvas, designItem);
  }
}