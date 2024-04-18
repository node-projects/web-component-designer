import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { BasicStackedToolbarExtension } from "../BasicStackedToolbarExtension.js";
import { assetsPath } from "../../../../../Constants.js";

export class GridToolbarExtension extends BasicStackedToolbarExtension {

  protected static template = html`
    <div style="height: 100%; width: 100%;">
      ${BasicStackedToolbarExtension.basicTemplate}
      <select title="display" id="gridType" style="pointer-events: all; height: 24px; width: 60px; padding: 0; margin-right: 10px">
        <option>1x1</option>
        <option>1x16</option>
        <option>2x8</option>
        <option>4x4</option>
        <option>8x2</option>
        <option>16x1</option>
        <option>custom</option>
      </select>
      <node-projects-image-button-list-selector property="align-content" no-value-in-header id="align-content">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/align-content-center-icon.svg">
        <img title="space-around" data-value="space-around" src="${assetsPath}images/chromeDevtools/align-content-space-around-icon.svg">
        <img title="space-evenly" data-value="space-evenly" src="${assetsPath}images/chromeDevtools/align-content-space-evenly-icon.svg">
        <img title="space-between" data-value="space-between" src="${assetsPath}images/chromeDevtools/align-content-space-between-icon.svg">
        <img title="stretch" data-value="stretch" src="${assetsPath}images/chromeDevtools/align-content-stretch-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="justify-content" no-value-in-header id="justify-content">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/justify-content-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/justify-content-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/justify-content-end-icon.svg">
        <img title="space-around" data-value="space-around" src="${assetsPath}images/chromeDevtools/justify-content-space-around-icon.svg">
        <img title="space-evenly" data-value="space-evenly" src="${assetsPath}images/chromeDevtools/justify-content-space-evenly-icon.svg">
        <img title="space-between" data-value="space-between" src="${assetsPath}images/chromeDevtools/justify-content-space-between-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="align-items" no-value-in-header id="align-items">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/align-items-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/align-items-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/align-items-end-icon.svg">
        <img title="stretch" data-value="stretch" src="${assetsPath}images/chromeDevtools/align-items-stretch-icon.svg">
        <img title="space-evenly" data-value="space-evenly" src="${assetsPath}images/chromeDevtools/align-items-baseline-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="justify-items" no-value-in-header id="justify-items">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/justify-items-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/justify-items-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/justify-items-end-icon.svg">
        <img title="stretch" data-value="stretch" src="${assetsPath}images/chromeDevtools/justify-items-stretch-icon.svg">
      </node-projects-image-button-list-selector>
    </div>
  `;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._size.width = 624;
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    super.extend(cache, event);

    const style = getComputedStyle(this.extendedItem.element);

    const gridTypeEl = this._toolbar.getById<HTMLSelectElement>('gridType');
    let op = document.createElement('option');
    op.innerText = style.gridTemplateColumns.split(' ').length + 'x' + style.gridTemplateRows.split(' ').length;
    gridTypeEl.insertAdjacentElement('afterbegin', op);
    gridTypeEl.selectedIndex = 0;
    gridTypeEl.onchange = async () => {
      if (gridTypeEl.value == 'custom') {
        const columns = prompt("Number of columns?", '4');
        if (!columns) return;
        const rows = prompt("Number of rows?", '4');
        if (!rows) return;
        const cg = this.extendedItem.openGroup('change grid type');
        await this.extendedItem.updateStyleInSheetOrLocalAsync('grid-template-columns', '1fr '.repeat(parseInt(columns)).trim());
        await this.extendedItem.updateStyleInSheetOrLocalAsync('grid-template-rows', '1fr '.repeat(parseInt(rows)).trim());
        cg.commit();
      } else {
        const parts = gridTypeEl.value.split('x');
        const cg = this.extendedItem.openGroup('change grid type');
        await this.extendedItem.updateStyleInSheetOrLocalAsync('grid-template-columns', '1fr '.repeat(parseInt(parts[0])).trim());
        await this.extendedItem.updateStyleInSheetOrLocalAsync('grid-template-rows', '1fr '.repeat(parseInt(parts[1])).trim());
        cg.commit();
      }
    }

    this._addStyleButton('align-content');
    this._addStyleButton('justify-content');
    this._addStyleButton('align-items');
    this._addStyleButton('justify-items');

    this.refresh(cache, event);
  }
}