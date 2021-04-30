import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";

export class BooleanPropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = "checkbox";
    element.onchange = (e) => this._valueChanged(element.checked);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.checked = value;
  }
}