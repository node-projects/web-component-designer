import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class BooleanPropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = "checkbox";
    if (property.readonly)
      element.readOnly = true;
    element.onchange = (e) => this._valueChanged(element.checked);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.checked = value;
  }
}