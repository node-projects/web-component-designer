import { BaseCustomWebComponentConstructorAppend, css } from '@node-projects/base-custom-webcomponent';
import { DesignerToolbar } from '../DesignerToolbar.js';

export abstract class AbstractBaseToolPopup extends BaseCustomWebComponentConstructorAppend {

  static override style: CSSStyleSheet | CSSStyleSheet[] = css`
      .container {
          width: 120px;
          min-height: 100px;
          color: var(--wcd-color-text, white);
          background-color: var(--wcd-tool-popup-title-background, rgb(64, 64, 64));
          border: 1px solid var(--wcd-tool-popup-border-color, black);
      }
      header {
          text-align: center;
      }
      .tool {
          height: 32px;
          width: 32px;
          background-color: var(--wcd-tool-popup-background, rgb(255, 255, 255));
          background-size: 65%;
          background-repeat: no-repeat;
          background-position: center center;
          flex-shrink: 0;
          border-bottom: 1px solid var(--wcd-tool-popup-border-color, black);
      }
      .tools {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 5px;
          gap: 3px;
      }`

  constructor() {
    super();

    for (let e of [...this.shadowRoot.querySelectorAll("div.tool")]) {
      let div = (<HTMLDivElement>e);
      div.onclick = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setTool(div.dataset['commandParameter']);
    }
  }
}