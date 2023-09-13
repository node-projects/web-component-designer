import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';

export type ImageButtonListSelectorValueChangedEventArgs = { newValue?: string, oldValue?: string };

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
      <div><span id="property"></span>: <span id="value"></span></div>
      <div class="container"><slot id="slot"></slot></div>
    </div>
  `;

  private _value: string;
  public get value() {
    return this._value;
  }
  public set value(value) {
    const oldValue = this._value;
    this._value = value;
    this._updateValue();
    this.valueChanged.emit({ newValue: this._value, oldValue: oldValue });
  }
  public valueChanged = new TypedEvent<ImageButtonListSelectorValueChangedEventArgs>();

  public property: string;
  public unsetValue: string;

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

    const slot = this._getDomElement<HTMLSlotElement>('slot');
    slot.onclick = (e) => {
      const path = e.composedPath();
      for (let e of slot.assignedElements()) {
        if (path.indexOf(e) >= 0) {
          this.value = (<HTMLElement>e).dataset.value;
        }
      }
    }

    this._getDomElement<HTMLSpanElement>('property').innerText = this.property ?? '';
    this._getDomElement<HTMLSpanElement>('value').innerText = this.unsetValue ?? '';
    this._updateValue();
  }
}

customElements.define('node-projects-image-button-list-selector', ImageButtonListSelector);