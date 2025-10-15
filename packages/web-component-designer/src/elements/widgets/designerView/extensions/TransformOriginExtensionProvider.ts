import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { TransformOriginExtension } from './TransformOriginExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";
import { getBoundingClientRectAlsoForDisplayContents } from '../../../helper/ElementHelper.js';

export class TransformOriginExtensionProvider implements IDesignerExtensionProvider {
  showOnlyWhenSet: boolean;

  constructor(showOnlyWhenSet = true) {
    this.showOnlyWhenSet = showOnlyWhenSet;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (!designItem.isRootItem && designItem.node instanceof HTMLElement || (designItem.node instanceof SVGElement && designItem.node.localName === 'svg')) {
      if (!this.showOnlyWhenSet)
        return true;
      if (designItem.hasStyle('transformOrigin'))
        return true;
      const cs = getComputedStyle(designItem.element);
      if (cs.display != 'inline' && designItem.element.getBoundingClientRect) {
        const r = getBoundingClientRectAlsoForDisplayContents(designItem.element);
        const pr = cs.transformOrigin.split(' ');
        const x = parseFloat(pr[0]) - r.width / 2;
        const y = parseFloat(pr[1]) - r.height / 2;
        if (x > 0.5 || x < -0.5 || y > 0.5 || y < -0.5)
          return true;
      }
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new TransformOriginExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-transform-origin { stroke: #3899ec; fill: black; pointer-events: all }
  `;
}