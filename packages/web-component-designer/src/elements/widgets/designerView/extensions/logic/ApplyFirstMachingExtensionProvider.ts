import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';

export class ApplyFirstMachingExtensionProvider implements IDesignerExtensionProvider {

  private extensions: IDesignerExtensionProvider[]
  private extIndex: number;
  public style: CSSStyleSheet[];
  public svgDefs: string[];

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
      if (e.constructor.style) {
        if (!this.style)
          this.style = [];
        if (Array.isArray(e.constructor.style))
          this.style.push(...e.constructor.style);
        else
          this.style.push(e.constructor.style);
      }
      if (e.svgDefs) {
        if (!this.svgDefs)
          this.svgDefs = [];
        if (Array.isArray(e.svgDefs))
          this.svgDefs.push(...e.svgDefs);
        else
          this.svgDefs.push(e.svgDefs);
      }
      if (e.constructor.svgDefs) {
        if (!this.svgDefs)
          this.svgDefs = [];
        if (Array.isArray(e.constructor.svgDefs))
          this.svgDefs.push(...e.svgDefs);
        else
          this.svgDefs.push(e.constructor.svgDefs);
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