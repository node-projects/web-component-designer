import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';

export type ImageButtonListSelectorValueChangedEventArgs = { newValue?: string, oldValue?: string };

export class NumericStyleInput extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
    }

    input {
      cursor: ew-resize;
    }
  `;

  public static override readonly template = html`
    <input id="input" type="text">
    <select id="select">
      <option>px</option>
      <option>%</option>
      <option>pt</option>
    </select>
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

  private _input: HTMLInputElement;
  private _select: HTMLSelectElement;

  constructor() {
    super();
    this._input = this._getDomElement<HTMLInputElement>('input');
    this._select = this._getDomElement<HTMLSelectElement>('select');

    let oldX: number = null;
    this._input.onpointerdown = (e) => {
      oldX = e.x;
      this._input.setPointerCapture(e.pointerId);
    }
    this._input.onpointermove = (e) => {
      if (oldX !== null) {
        let diffX = e.x - oldX;
        if (diffX != 0)
          this._input.value = <any>parseInt(this._input.value) + diffX;
      }
    }
    this._input.onpointerup = (e) => {
      oldX = null;
      this._input.releasePointerCapture(e.pointerId);
    }
  }
  private _updateValue() {

  }

}

customElements.define('node-projects-numeric-style-input', NumericStyleInput);