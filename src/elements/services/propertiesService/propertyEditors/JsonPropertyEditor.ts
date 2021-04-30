import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";
import { html } from '@node-projects/base-custom-webcomponent';

export class JsonPropertyEditor extends BasePropertyEditor<HTMLDivElement> {

  static template = html`
    <div style="display: flex;">
      <input id="input" type="text">
      <button style="width: 30px;">...</button>
    </div>
  `;

  _input: HTMLInputElement;

  constructor(property: IProperty) {
    super(property);

    let el = <HTMLDivElement>JsonPropertyEditor.template.content.cloneNode(true);
    this._input = <HTMLInputElement>(<DocumentFragment><any>el).getElementById('input')
    this._input.onchange = (e) => this._valueChanged(this._input.value);
    this.element = el;
  }

  refreshValue(valueType: ValueType, value: any) {
    this._input.value = value;
  }
}