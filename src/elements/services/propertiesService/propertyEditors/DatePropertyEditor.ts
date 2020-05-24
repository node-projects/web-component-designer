import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";

export class DatePropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);
   
    let element = document.createElement('input');
    element.type = "datetime-local"
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