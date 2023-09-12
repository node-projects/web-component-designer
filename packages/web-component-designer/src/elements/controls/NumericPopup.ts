import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export class NumericPopup extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
    }
    .predefined {
      grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
      grid-template-columns: 1fr 1fr;
    }
  `;

  public static override readonly template = html`
    <div>
      <input type="range" min="0" max="100">
      <input id="value">
      <select>
        <option>px</option>
        <option>%</option>
        <option>pt</option>
        <option>em</option>
        <option>rem</option>
        <option>auto</option>
      </select>
    </div>
    <div class="predefined">
      <button>Auto</button>
      <button>0</button>
      <button>10</button>
      <button>20</button>
      <button>40</button>
      <button>50</button>
      <button>70</button>
      <button>90</button>
      <button>100</button>
    </div>
  `;

  ready() {

    
  }
}

customElements.define('node-projects-numeric-popup', NumericPopup);