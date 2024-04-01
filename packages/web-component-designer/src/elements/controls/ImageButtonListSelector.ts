import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export class ImageButtonListSelector extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    div {
      font-size: 10px;
      color: white;
    }
    #property {
      color: #00aff0;
    }
    #value {
      color: lightgray;
    }
    #value.value-set {
      color: wheat;
    }
    .container {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
    }
    ::slotted(button) {
      min-width: 24px;
      height: 24px;
      padding: 1px;
      background: white;
      border: 1px solid lightgray;
    }
  `;

  public static override readonly template = html`
    <div>
      <div id="header" style="display: none"><span id="property"></span><span id="vhd">: <span id="value"></span></span></div>
      <div part="container" class="container"><slot id="slot"></slot></div>
    </div>
  `;

  public static properties = {
    value: String,
    property: String,
    unsetValue: String,
    noValueInHeader: Boolean
  }

  constructor() {
    super();
    this._restoreCachedInititalValues();
  }

  private _value: string;
  public get value() {
    return this._value;
  }
  public set value(value) {
    this._value = value;
    this._updateValue();
  }

  public property: string;
  public unsetValue: string;
  public noValueInHeader: boolean;

  _updateValue() {
    if (this.value) {
      this._getDomElement<HTMLSpanElement>('value').innerText = this.value;
      this._getDomElement<HTMLSpanElement>('value').classList.add('value-set');
    } else {
      this._getDomElement<HTMLSpanElement>('value').classList.remove('value-set');
    }

    const slot = this._getDomElement<HTMLSlotElement>('slot');
    for (let e of slot.assignedElements()) {
      if ((<HTMLElement>e).dataset.value == this.value)
        (<HTMLElement>e).style.background = "cornflowerblue";
      else (<HTMLElement>e).style.background = "";
    }
  }

  ready() {
    this._parseAttributesToProperties();

    if (this.property)
      this._getDomElement<HTMLSpanElement>('header').style.display = 'block';

    if (this.noValueInHeader)
      this._getDomElement<HTMLSpanElement>('vhd').style.display = 'none';

    const slot = this._getDomElement<HTMLSlotElement>('slot');
    slot.onclick = (e) => {
      const path = e.composedPath();
      for (let e of slot.assignedElements()) {
        if (path.indexOf(e) >= 0) {
          const oldValue = this._value;
          this.value = (<HTMLElement>e).dataset.value;
          const valueChangedEvent = new CustomEvent('value-changed', {
            detail: {
              newValue: this._value, oldValue: oldValue
            }
          });
          this.dispatchEvent(valueChangedEvent);
        }
      }
    }

    this._getDomElement<HTMLSpanElement>('property').innerText = this.property ?? '';
    this._getDomElement<HTMLSpanElement>('value').innerText = this.unsetValue ?? '';
    this._updateValue();
  }
}

customElements.define('node-projects-image-button-list-selector', ImageButtonListSelector);