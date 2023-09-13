import { BaseCustomWebComponentLazyAppend, css, html, DomHelper } from '@node-projects/base-custom-webcomponent';
import { IDesignerCanvas, IMiniatureView } from '@node-projects/web-component-designer';


export class Html2CanvasMiniatureView extends BaseCustomWebComponentLazyAppend implements IMiniatureView {

  static override readonly style = css``;

  static override readonly template = html`
        <div class="imgdiv">
        </div>`;

  private _imgdiv: HTMLDivElement;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    
    this._imgdiv = this._getDomElement<HTMLDivElement>('imgdiv');
  }

  reRender(designerView: IDesignerCanvas) {
    //@ts-ignore
    html2canvas(designerView.rootDesignItem.element).then(canvas => {
      DomHelper.removeAllChildnodes(this._imgdiv);
      this._imgdiv.appendChild(canvas);
    });
  }
}

customElements.define('node-projects-html-2-canvas-miniature-view', Html2CanvasMiniatureView);