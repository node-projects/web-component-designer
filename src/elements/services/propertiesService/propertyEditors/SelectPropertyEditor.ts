import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class SelectPropertyEditor extends BasePropertyEditor<HTMLSelectElement> {

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement("select");
    if (property.type == 'enum') {
      for (let v of property.enumValues) {
        let option = document.createElement("option");
        option.value = <any>v[1];
        option.text = v[0];
        element.appendChild(option);
      }
    } else {
      for (let v of property.values) {
        let option = document.createElement("option");
        option.value = v;
        option.text = v;
        element.appendChild(option);
      }
    }
    element.onchange = (e) => this._valueChanged(element.value);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value;
  }
}