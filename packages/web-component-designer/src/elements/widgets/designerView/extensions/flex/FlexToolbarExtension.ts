import { html } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { assetsPath } from "../../../../../Constants.js";
import { BasicStackedToolbarExtension } from "../BasicStackedToolbarExtension.js";
import { ImageButtonListSelector } from "../../../../controls/ImageButtonListSelector.js";

export class FlexToolbarExtension extends BasicStackedToolbarExtension {

  protected static template = html`
    <div style="height: 100%; width: 100%;">
      ${BasicStackedToolbarExtension.basicTemplate}
      <node-projects-image-button-list-selector property="direction" no-value-in-header id="flex-direction">
        <img title="row" data-value="row" src="${assetsPath}images/chromeDevtools/flex-direction-row-icon.svg">
        <img title="column" data-value="column" src="${assetsPath}images/chromeDevtools/flex-direction-column-icon.svg">
        <img title="row-reverse" data-value="row-reverse" style="transform: scaleX(-1);" src="${assetsPath}images/chromeDevtools/flex-direction-row-icon.svg">
        <img title="column-reverse" data-value="column-reverse" style="transform: scaleY(-1);" src="${assetsPath}images/chromeDevtools/flex-direction-column-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="wrap" no-value-in-header id="flex-wrap">
        <img title="nowrap" data-value="nowrap" src="${assetsPath}images/chromeDevtools/flex-wrap-nowrap-icon.svg">
        <img title="wrap" data-value="wrap" src="${assetsPath}images/chromeDevtools/flex-wrap-wrap-icon.svg">
      </node-projects-image-button-list-selector>
      <node-projects-image-button-list-selector property="align-content" no-value-in-header id="align-content">
        <img title="start" data-value="start" src="${assetsPath}images/chromeDevtools/align-content-flex-start-icon.svg">
        <img title="center" data-value="center" src="${assetsPath}images/chromeDevtools/align-content-center-icon.svg">
        <img title="end" data-value="end" src="${assetsPath}images/chromeDevtools/align-content-flex-end-icon.svg">
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
    </div>
  `;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
    this._size.width = 625;
  }

  override extend(cache: Record<string | symbol, any>, event: MouseEvent) {
    super.extend(cache, event);
    this._addFlexDirectionButton();
    this._addStyleButton('flex-wrap');
    this._addStyleButton('align-content');
    this._addStyleButton('justify-content');
    this._addStyleButton('align-items');
    this.refresh(cache, event);
  }

  protected _addFlexDirectionButton() {
    const cs = getComputedStyle(this.extendedItem.element);
    const ctl = this._toolbar.getById<ImageButtonListSelector>('flex-direction')
    ctl.addEventListener('value-changed', async () => {
      await this.extendedItem.updateStyleInSheetOrLocalAsync('flex-direction', ctl.value);
      this.rotateImagesAcordingFlexDirection(ctl.value);
    });
    ctl.value = cs['flex-direction'];
    this.rotateImagesAcordingFlexDirection(ctl.value);
  }

  rotateImagesAcordingFlexDirection(direction: string) {
    let angle = 0
    if (direction == 'column' || direction == 'column-reverse')
      angle = -90;
    this._toolbar.getById('flex-wrap').querySelectorAll('img').forEach(x => x.style.rotate = angle + 'deg');
    this._toolbar.getById('align-content').querySelectorAll('img').forEach(x => x.style.rotate = angle + 'deg');
    this._toolbar.getById('justify-content').querySelectorAll('img').forEach(x => x.style.rotate = angle + 'deg');
    //@ts-ignore
    this._toolbar.getById('align-items').querySelectorAll('img:nth-child(-n+4)').forEach(x => x.style.rotate = angle + 'deg');
  }
}