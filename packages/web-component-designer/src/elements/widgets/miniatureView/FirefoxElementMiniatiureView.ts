import { BaseCustomWebComponentLazyAppend, html } from '@node-projects/base-custom-webcomponent';
import { IMiniatureView } from './IMiniatureView.js';
import { IDesignerCanvas } from '../designerView/IDesignerCanvas.js';

//TODO: does not work atm.
//see: https://bugzilla.mozilla.org/show_bug.cgi?id=1966844
export class FirefoxElementMiniatiureView extends BaseCustomWebComponentLazyAppend implements IMiniatureView {

  static override readonly template = html`<div class="imgdiv"></div>`;

  private _imgdiv: HTMLDivElement;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    
    this._imgdiv = this._getDomElement<HTMLDivElement>('imgdiv');
    this._imgdiv.style.backgroundImage = `-moz-element(#web-compoent-designer-${1234})`
  }

  reRender(designerView: IDesignerCanvas) {
    //@ts-ignore
    document.mozSetImageElement("web-compoent-designer", designerView.rootDesignItem.element);
  }
}

customElements.define('node-projects-firefox-element-miniature-view', FirefoxElementMiniatiureView);