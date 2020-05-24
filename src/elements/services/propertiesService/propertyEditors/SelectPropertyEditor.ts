import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";

export class SelectPropertyEditor extends BasePropertyEditor<HTMLSelectElement> {

  constructor(property: IProperty) {
    super(property);
   
    let element = document.createElement("select");
    for (let v of property.values) {
        let option = document.createElement("option");
        option.value = v;
        option.text = v;
        element.appendChild(option);
    }
    element.onchange = (e) => this._valueChanged(element.value);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (valueType == 'none')
      this.element.value = null;
    else
      this.element.value = value;
  }
}