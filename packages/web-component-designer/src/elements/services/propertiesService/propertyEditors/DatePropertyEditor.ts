import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class DatePropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);
   
    let element = document.createElement('input');
    element.type = "datetime-local";
    if (property.readonly)
      element.readOnly = true;
    element.onchange = (e) => this._valueChanged(element.value);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (!value)
      this.element.value = null;
    else
      this.element.value = value;
  }
}