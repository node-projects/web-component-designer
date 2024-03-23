import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension, toolbarObject } from "../AbstractExtension.js";
import { IExtensionManager } from '../IExtensionManger.js';

export class FlexToolbarExtension extends AbstractExtension {

  private static template = html`
    <div style="height: 100%; width: 100%;">
      <select id="displayType" style="pointer-events: all; height: 24px; width: 70px; padding: 0; font-weight: 900; text-transform: uppercase; margin-right: 10px;">
        <option>block</option>
        <option selected>flex</option>
        <option>grid</option>
      </select>
    </div>
  `;

  private _toolbar: toolbarObject;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    this._toolbar = this.createToolbar(FlexToolbarExtension.template, 200, 30);
    const displayTypeEl = this._toolbar.getById<HTMLSelectElement>('displayType');
    displayTypeEl.onchange = () => {
      this.extendedItem.updateStyleInSheetOrLocal('display', displayTypeEl.value);
      this.extensionManager.reapplyAllAppliedExtentions([this.extendedItem]);
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