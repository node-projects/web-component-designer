import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class SelectPropertyEditor extends BasePropertyEditor<HTMLDivElement> {

  elementSelect: HTMLSelectElement;
  elementInput: HTMLInputElement;

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement("div");

    let elementSel = document.createElement("select");
    if (property.type == 'enum') {
      for (let v of property.enumValues) {
        let option = document.createElement("option");
        option.value = <any>v[1];
        option.text = v[0];
        elementSel.appendChild(option);
      }
    } else {
      for (let v of property.values) {
        let option = document.createElement("option");
        option.value = v;
        option.text = v;
        elementSel.appendChild(option);
      }
    }
    if (property.readonly)
      elementSel.disabled = true;
    elementSel.onchange = (e) => this._valueChanged(elementSel.value);

    let elementInput = document.createElement("input");
    elementInput.style.display = 'none'
    elementInput.onchange = (e) => this._valueChanged(elementInput.value);

    this.elementSelect = elementSel;
    this.elementInput = elementInput;
    element.appendChild(this.elementSelect);
    element.appendChild(this.elementInput);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.elementSelect.style.display = 'block';
    this.elementInput.style.display = 'none';
    this.elementSelect.value = value;
    if (this.elementSelect.value != value && value) {
      this.elementInput.value = value;
      this.elementSelect.style.display = 'none';
      this.elementInput.style.display = 'block';
    }
  }
}