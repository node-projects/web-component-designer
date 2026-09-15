import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { PositionExtension } from './PositionExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { css } from "@node-projects/base-custom-webcomponent";

export interface PositionExtensionOptions {
  /** Allow switching the anchored side of absolute elements. Defaults to true. */
  allowDocking?: boolean;
}

export class PositionExtensionProvider implements IDesignerExtensionProvider {
  constructor(private readonly _options: PositionExtensionOptions = {}) {
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (!designItem?.parent || designItem.element instanceof HTMLTemplateElement)
      return false;
    const cs = getComputedStyle((<HTMLElement>designItem.element));
    if (cs.position === 'relative' || cs.position === 'absolute')
      return true;
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new PositionExtension(extensionManager, designerView, designItem, this._options);
  }

  static readonly style = css`
    .svg-position-text { text-anchor: middle; alignment-baseline: central; }
    .svg-position-lock rect { fill: white; stroke: #888; stroke-width: 1; }
    .svg-position-lock path { fill: none; stroke: black; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .svg-position-lock[aria-pressed="true"] path { stroke: var(--wcd-color-selection, #3899ec); }
    .svg-position-lock[aria-disabled="false"]:hover rect, .svg-position-lock:focus rect { stroke: var(--wcd-color-selection, #3899ec); fill: #eaf4fc; }
  `;
}