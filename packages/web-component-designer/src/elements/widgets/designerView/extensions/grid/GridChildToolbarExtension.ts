import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { assetsPath } from "../../../../../Constants.js";
import { BasicStackedToolbarExtension } from "../BasicStackedToolbarExtension.js";

export class GridChildToolbarExtension extends BasicStackedToolbarExtension {

  protected static template = html`
    <div style="height: 100%; width: 100%;">
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 10px; color: #00aff0;">column:</span>
        <input type="text" title="column" id="gridColumn" style="pointer-events: all; height: 12px; width: 45px; padding: 0; margin-right: 5px">
      </div>
       <div style="display: flex; flex-direction: column;">
        <span style="font-size: 10px; color: #00aff0;">row:</span>
        <input type="text" title="column" id="gridRow" style="pointer-events: all; height: 12px; width: 45px; padding: 0; margin-right: 10px">
      </div>
      <node-projects-image-button-list-selector property="align-self" no-value-in-header id="align-self">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/align-items-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/align-items-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/align-items-end-icon.svg">
        <img title="stretch" data-value="stretch" src="${assetsPath}images/chromeDevtools/align-items-stretch-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="justify-self" no-value-in-header id="justify-self">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/justify-items-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/justify-items-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/justify-items-end-icon.svg">
        <img title="stretch" data-value="stretch" src="${assetsPath}images/chromeDevtools/justify-items-stretch-icon.svg">
      </node-projects-image-button-list-selector>
    </div>`;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._size.width = 250;
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    super.extend(cache, event);

    const cs = getComputedStyle(this.extendedItem.element);
    const gridColumnEl = this._toolbar.getById<HTMLSelectElement>('gridColumn');
    if (gridColumnEl) {
      gridColumnEl.value = cs.gridColumn;
      gridColumnEl.onkeyup = async (e) => {
        if (e.key === 'Enter')
          await this.extendedItem.updateStyleInSheetOrLocalAsync('gridColumn', gridColumnEl.value);
      }
    }
    const gridRowEl = this._toolbar.getById<HTMLSelectElement>('gridRow');
    if (gridRowEl) {
      gridRowEl.value = cs.gridColumn;
      gridRowEl.onkeyup = async (e) => {
        if (e.key === 'Enter')
          await this.extendedItem.updateStyleInSheetOrLocalAsync('gridRow', gridRowEl.value);
      }
    }

    this._addStyleButton('align-self');
    this._addStyleButton('justify-self');

    this.refresh(cache, event);
  }
}