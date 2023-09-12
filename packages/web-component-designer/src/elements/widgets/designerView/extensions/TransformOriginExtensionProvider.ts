import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { TransformOriginExtension } from './TransformOriginExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export class TransformOriginExtensionProvider implements IDesignerExtensionProvider {
  showOnlyWhenSet: boolean;
  
  constructor(showOnlyWhenSet = true) {
    this.showOnlyWhenSet = showOnlyWhenSet;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.node instanceof HTMLElement || (designItem.node instanceof SVGElement && designItem.node.localName === 'svg')) {
      if (!this.showOnlyWhenSet)
        return true;
      if (designItem.hasStyle('transformOrigin'))
        return true;
      if (getComputedStyle(designItem.element).display != 'inline' && designItem.element.getBoundingClientRect) {
        const r = designItem.element.getBoundingClientRect();
        if (getComputedStyle(designItem.element).transformOrigin != r.width / 2 + 'px ' + r.height / 2 + 'px')
          return true;
      }
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new TransformOriginExtension(extensionManager, designerView, designItem);
  }

  readonly style = css`
    .svg-transform-origin { stroke: #3899ec; fill: black; pointer-events: all }
  `;
}