import { assetsPath } from "../../../../Constants.js";
import { AbstractExtension, toolbarObject } from "./AbstractExtension.js";
import { IExtensionManager } from "./IExtensionManger.js";
import { IDesignerCanvas } from "../IDesignerCanvas.js";
import { IDesignItem } from "../../../item/IDesignItem.js";
import { ImageButtonListSelector } from "../../../controls/ImageButtonListSelector.js";

export const basicStackedToolbarExtensionOverlayOptionName = 'basicStackedToolbarExtensionShowOverlay';

export class BasicStackedToolbarExtension extends AbstractExtension {

  protected static basicTemplate = `
      <select title="position" id="position" style="pointer-events: auto; height: 24px; width: 80px; padding: 0; font-weight: 900; text-transform: uppercase; margin-left: 5px; margin-right: 10px;">
        <option>static</option>
        <option>relative</option>
        <option>absolute</option>
        <option>fixed</option>
      </select>
      <node-projects-image-button-list-selector id="inline" no-value-in-header property="inline">
        <img data-value="block" title="block" src="${assetsPath}images/display/block.svg">
        <img data-value="inline" title="inline" src="${assetsPath}images/display/inline.svg">
      </node-projects-image-button-list-selector>
      <select title="display" id="displayType" style="pointer-events: auto; height: 24px; width: 80px; padding: 0; font-weight: 900; text-transform: uppercase; margin-left: 5px; margin-right: 10px;">
        <option>block</option>
        <option>flex</option>
        <option>grid</option>
      </select>
  `;

  protected static toolBars: toolbarObject[] = [];

  protected _toolbar: toolbarObject;
  protected _size = { width: 220, height: 30 };

  protected _display: string;
  protected _inline: string;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    const cs = getComputedStyle(this.extendedItem.element);
    this._display = cs.display.replace('inline-', '').replace('inline', 'block');
    this._inline = cs.display.startsWith('inline') ? 'inline' : 'block';

    //@ts-ignore
    this._toolbar = this.createToolbar(this.constructor.template, this._size.width, this._size.height);
    BasicStackedToolbarExtension.toolBars.push(this._toolbar);

    const positionEl = this._toolbar.getById<HTMLSelectElement>('position');
    if (positionEl) {
      positionEl.value = cs.position;
      positionEl.onchange = async () => {
        await this.extendedItem.updateStyleInSheetOrLocalAsync('position',  positionEl.value);
        this.extensionManager.reapplyAllAppliedExtentions([this.extendedItem]);
      }
    }

    const displayTypeEl = this._toolbar.getById<HTMLSelectElement>('displayType');
    if (displayTypeEl) {
      displayTypeEl.value = this._display;
      displayTypeEl.onchange = async () => {
        this._display = displayTypeEl.value;
        await this.updateDisplayValue();
        this.extensionManager.reapplyAllAppliedExtentions([this.extendedItem]);
      }
    }

    const inlineEl = this._toolbar.getById<ImageButtonListSelector>('inline');
    if (inlineEl) {
      inlineEl.value = this._inline;
      inlineEl.addEventListener('value-changed', async () => {
        this._inline = inlineEl.value;
        if (this._inline && cs.position === 'absolute')
          this.extendedItem.setStyle('position', 'static');
        await this.updateDisplayValue();
        this.extensionManager.reapplyAllAppliedExtentions([this.extendedItem]);
      });
    }
  }

  async updateDisplayValue() {
    let v = (this._inline == 'inline' ? 'inline ' : '') + this._display;
    if (v === 'inline block')
      v = 'inline';
    await this.extendedItem.updateStyleInSheetOrLocalAsync('display', v);
  }

  override refresh(cache: Record<string | symbol, any>, event?: MouseEvent) {
    if (event) {
      const pos = this.designerCanvas.getNormalizedEventCoordinates(event);
      let tbOffset = 0;
      for (let i = 0; i < BasicStackedToolbarExtension.toolBars.length - 1; i++) {
        if (BasicStackedToolbarExtension.toolBars[i] === this._toolbar)
          break;
        tbOffset += this._toolbar.children[0].getBoundingClientRect().height + 4;
      }
      this._toolbar.updatePosition({ x: (pos.x - (16 / this.designerCanvas.zoomFactor)), y: (pos.y - tbOffset - ((this._size.height + 14) / this.designerCanvas.zoomFactor)) });
    }
  }

  protected _addStyleButton(styleAndControlName: string) {
    const cs = getComputedStyle(this.extendedItem.element);
    const ctl = this._toolbar.getById<ImageButtonListSelector>(styleAndControlName)
    ctl.addEventListener('value-changed', async () => {
      await this.extendedItem.updateStyleInSheetOrLocalAsync(styleAndControlName, ctl.value);
    });
    ctl.value = cs[styleAndControlName];
  }

  override dispose() {
    BasicStackedToolbarExtension.toolBars.splice(BasicStackedToolbarExtension.toolBars.indexOf(this._toolbar), 1);
    this._removeAllOverlays();
  }
}