import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension, toolbarObject } from "../AbstractExtension.js";
import { IExtensionManager } from '../IExtensionManger.js';

export class GridToolbarExtension extends AbstractExtension {

  private static template = html`
    <div style="height: 100%; width: 100%;">
      <select id="displayType" style="pointer-events: all; height: 24px; width: 70px; padding: 0; font-weight: 900; text-transform: uppercase; margin-right: 10px;">
        <option>block</option>
        <option>flex</option>
        <option selected>grid</option>
      </select>
      <select id="gridType" style="pointer-events: all; height: 24px; width: 60px; padding: 0;">
        <option>1x1</option>
        <option>1x16</option>
        <option>2x8</option>
        <option>4x4</option>
        <option>8x2</option>
        <option>16x1</option>
        <option>custom</option>
      </select>
    </div>
  `;

  private _toolbar: toolbarObject;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    const style = getComputedStyle(this.extendedItem.element);

    this._toolbar = this.createToolbar(GridToolbarExtension.template, 200, 30);
    const displayTypeEl = this._toolbar.getById<HTMLSelectElement>('displayType');
    displayTypeEl.onchange = () => {
      this.extendedItem.updateStyleInSheetOrLocal('display', displayTypeEl.value);
      this.extensionManager.reapplyAllAppliedExtentions([this.extendedItem]);
    }
    const gridTypeEl = this._toolbar.getById<HTMLSelectElement>('gridType');
    let op = document.createElement('option');
    op.innerText = style.gridTemplateColumns.split(' ').length + 'x' + style.gridTemplateRows.split(' ').length;
    gridTypeEl.insertAdjacentElement('afterbegin', op);
    gridTypeEl.selectedIndex = 0;
    gridTypeEl.onchange = () => {
      if (gridTypeEl.value == 'custom') {
        const columns = prompt("Number of columns?", '4');
        if (!columns) return;
        const rows = prompt("Number of rows?", '4');
        if (!rows) return;
        this.extendedItem.updateStyleInSheetOrLocal('grid-template-columns', '1fr '.repeat(parseInt(columns)).trim());
        this.extendedItem.updateStyleInSheetOrLocal('grid-template-rows', '1fr '.repeat(parseInt(rows)).trim());
      } else {
        const parts = gridTypeEl.value.split('x');
        this.extendedItem.updateStyleInSheetOrLocal('grid-template-columns', '1fr '.repeat(parseInt(parts[0])).trim());
        this.extendedItem.updateStyleInSheetOrLocal('grid-template-rows', '1fr '.repeat(parseInt(parts[1])).trim());
      }
    }
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: MouseEvent) {
    if (event) {
      const pos = this.designerCanvas.getNormalizedEventCoordinates(event);
      this._toolbar.updatePosition({ x: (pos.x - 16), y: (pos.y - 44) });
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}