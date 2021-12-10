import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class SimpleSplitView extends BaseCustomWebComponentConstructorAppend {
  static override readonly style = css`
    :host {
      display: block;
    }  
    #split {
      position: relative;
      height: 100%;
      width: 100%;
      grid-template-rows: calc(var(--split) * 1%) 5px calc((100 - var(--split)) * 1%);
      display: grid;
      align-items: center;
    }
    #splitter {
      user-select: none;
    }
    :host(:not([orientation="vertical"])) > div > #splitter {
      cursor: ew-resize;
      width: 5px;
    }
    :host([orientation="vertical"]) > div > #splitter {
      cursor: ns-resize;
      height: 5px;
    }`;

  static override readonly template = html`
    <div id="split" style="--split: 50;">
      <slot name="top"></slot>  
      <div id="splitter"></div>
      <slot name="bottom"></slot>
    </div>`;

  public static properties = {
    orientation: String
  }

  orientation: 'vertical' | 'horizontal' = 'vertical';

  constructor() {
    super();
  }

  ready() {
    this._parseAttributesToProperties();
    this.setAttribute('orientation', this.orientation);

    const split = this._getDomElement<HTMLDivElement>("split");
    const splitter = this._getDomElement<HTMLDivElement>("splitter");

    let start: boolean = null;
    splitter.addEventListener('pointerdown', (e) => {
      splitter.setPointerCapture(e.pointerId);
      start = true;
    });
    splitter.addEventListener('pointerup', (e) => {
      splitter.releasePointerCapture(e.pointerId);
      start = null;
    });
    splitter.addEventListener('pointermove', (e) => {
      if (start !== null) {
        let splitValue = parseFloat(split.style.getPropertyValue('--split'));
        if (this.orientation === 'horizontal')
          splitValue += e.movementX * 100 / split.clientWidth;
        else
          splitValue += e.movementY * 100 / split.clientHeight;
        if (!isNaN(splitValue))
          split.style.setProperty("--split", <any>splitValue);
      }
    });
  }
}
customElements.define('node-projects-simple-split-view', SimpleSplitView);